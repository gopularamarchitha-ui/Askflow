import { z } from 'zod';

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format').optional(),
  message: z.string().min(1, 'Message cannot be empty').max(8000, 'Message is too long (max 8000 chars)'),
});

export const CreateConversationSchema = z.object({
  title: z.string().max(100, 'Title is too long').optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
