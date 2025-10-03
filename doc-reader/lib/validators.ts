import { z } from 'zod';

export const urlSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
  conversationId: z.string().uuid().optional(),
  guideId: z.string().uuid().optional(),
});

export const processUrlSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  forceRefresh: z.boolean().optional().default(false),
});

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function hashURL(url: string): string {
  return hashString(new URL(url).href);
}
