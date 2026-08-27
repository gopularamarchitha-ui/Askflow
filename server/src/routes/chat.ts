import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { getAuthenticatedSupabaseClient } from '../config/supabase.js';
import { SendMessageSchema } from '../validators/schemas.js';
import { generateGeminiResponse, ChatHistoryItem } from '../services/geminiService.js';

const router = Router();

// Apply auth middleware to chat route
router.use(authenticateUser as any);

// POST /api/chat - Send message to Gemini and store conversation
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = SendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
      return;
    }

    const { message, conversationId: inputConvId } = parseResult.data;
    const userId = req.user!.id;
    const supabaseUserClient = getAuthenticatedSupabaseClient(req.token!);

    let conversationId = inputConvId;
    let isNewConversation = false;

    // 1. Create a new conversation if no conversationId is provided
    if (!conversationId) {
      const defaultTitle = message.length > 40 ? message.substring(0, 37) + '...' : message;
      const { data: newConv, error: convErr } = await supabaseUserClient
        .from('conversations')
        .insert({
          user_id: userId,
          title: defaultTitle,
        })
        .select()
        .single();

      if (convErr || !newConv) {
        console.error('Database error creating conversation:', convErr);
        res.status(400).json({ error: 'Failed to create conversation session', details: convErr?.message || 'Database table conversations missing' });
        return;
      }

      conversationId = newConv.id;
      isNewConversation = true;
    }

    // 2. Fetch existing message history for context (up to last 10 messages)
    let history: ChatHistoryItem[] = [];
    if (!isNewConversation) {
      const { data: pastMessages } = await supabaseUserClient
        .from('messages')
        .select('sender, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (pastMessages && pastMessages.length > 0) {
        history = pastMessages as ChatHistoryItem[];
      }
    }

    // 3. Store user message in Supabase
    const { data: userMsg, error: userMsgErr } = await supabaseUserClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        sender: 'user',
        content: message,
      })
      .select()
      .single();

    if (userMsgErr) {
      res.status(400).json({ error: 'Failed to save user message', details: userMsgErr.message });
      return;
    }

    // 4. Generate response from Gemini API
    const aiText = await generateGeminiResponse(message, history);

    // 5. Store AI assistant response in Supabase
    const { data: aiMsg, error: aiMsgErr } = await supabaseUserClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        sender: 'assistant',
        content: aiText,
      })
      .select()
      .single();

    if (aiMsgErr) {
      res.status(400).json({ error: 'Failed to save AI response', details: aiMsgErr.message });
      return;
    }

    // 6. Update conversation updated_at timestamp
    await supabaseUserClient
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    // 7. Return complete response payload to client
    res.json({
      conversationId,
      userMessage: userMsg,
      assistantMessage: aiMsg,
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({
      error: 'An error occurred while processing your chat request',
      details: err.message,
    });
  }
});

export default router;
