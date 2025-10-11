import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Note: Client-side OpenAI is optional.
// The improve-prompt feature uses the backend API endpoint.
// Other AI features (categorize, tag, quality) require VITE_OPENAI_API_KEY.

export const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
}) : null;

export const isOpenAIConfigured = !!apiKey;
