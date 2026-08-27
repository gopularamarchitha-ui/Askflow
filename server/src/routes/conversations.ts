import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { getAuthenticatedSupabaseClient } from '../config/supabase.js';
import { CreateConversationSchema } from '../validators/schemas.js';

const router = Router();

// Apply auth middleware to all conversation routes
router.use(authenticateUser as any);

// GET /api/conversations - Get all conversations for current user
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supabaseUserClient = getAuthenticatedSupabaseClient(req.token!);

    const { data: conversations, error } = await supabaseUserClient
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ conversations });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch conversations', details: err.message });
  }
});

// POST /api/conversations - Create a new conversation session
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = CreateConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { title } = parseResult.data;
    const supabaseUserClient = getAuthenticatedSupabaseClient(req.token!);

    const { data: conversation, error } = await supabaseUserClient
      .from('conversations')
      .insert({
        user_id: req.user!.id,
        title: title || 'New Chat',
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ conversation });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create conversation', details: err.message });
  }
});

// GET /api/conversations/:id - Get conversation details with message history
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const supabaseUserClient = getAuthenticatedSupabaseClient(req.token!);

    // Fetch conversation info
    const { data: conversation, error: convError } = await supabaseUserClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Fetch messages for this conversation
    const { data: messages, error: msgError } = await supabaseUserClient
      .from('messages')
      .select('id, sender, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      res.status(400).json({ error: msgError.message });
      return;
    }

    res.json({ conversation, messages });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch conversation detail', details: err.message });
  }
});

// DELETE /api/conversations/:id - Delete a conversation
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const supabaseUserClient = getAuthenticatedSupabaseClient(req.token!);

    const { error } = await supabaseUserClient
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete conversation', details: err.message });
  }
});

export default router;
