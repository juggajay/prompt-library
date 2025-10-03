import { OpenAI } from 'openai';
import { openai as aiOpenai } from '@ai-sdk/openai';

// Standard OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
  maxRetries: 3,
  timeout: 30000, // 30 seconds
});

// AI SDK embedding model
export const embeddingModel = aiOpenai.embedding('text-embedding-3-small');

// AI SDK chat model
export const chatModel = aiOpenai('gpt-4o');
export const chatModelMini = aiOpenai('gpt-4o-mini');
