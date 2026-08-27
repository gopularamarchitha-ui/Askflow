import { ai } from '../config/gemini.js';

export interface ChatHistoryItem {
  sender: 'user' | 'assistant';
  content: string;
}

export const generateGeminiResponse = async (
  prompt: string,
  history: ChatHistoryItem[] = []
): Promise<string> => {
  try {
    // Transform message history into Gemini contents format
    const contents = [
      ...history.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction:
          'You are AskFlow AI, an intelligent, helpful, and concise AI assistant. Provide formatted markdown output with code blocks when appropriate.',
      },
    });

    return response.text || 'I apologize, but I was unable to generate a response.';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini AI Error: ${error.message || 'Failed to call AI service'}`);
  }
};
