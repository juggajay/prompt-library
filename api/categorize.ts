import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { promptText } = req.body;

  if (!promptText) {
    return res.status(400).json({ error: 'Prompt text is required' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a prompt categorization assistant. Analyze the given prompt and return a JSON object with:
- category: one of [Marketing, Code Generation, Content Writing, Data Analysis, Customer Service, Education, Other]
- tags: array of 3-5 relevant tags
- confidence: float between 0 and 1

Response must be valid JSON only.`,
          },
          {
            role: 'user',
            content: promptText,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error categorizing prompt:', error);
    return res.status(500).json({ error: 'Failed to categorize prompt' });
  }
}
