import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, skipCache = false } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required and must be a string'
      });
    }

    if (prompt.trim().length < 10) {
      return res.status(400).json({
        error: 'Prompt must be at least 10 characters'
      });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({
        error: 'Prompt must be less than 4000 characters'
      });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured'
      });
    }

    // Step 1: Check cache (unless skipCache is true)
    const normalizedPrompt = prompt.trim().toLowerCase();
    const promptHash = crypto
      .createHash('md5')
      .update(normalizedPrompt)
      .digest('hex');

    // For now, we'll skip database caching and go straight to OpenAI
    // You can add Supabase integration later if needed

    // Step 2: Call OpenAI API
    console.log('Calling OpenAI API for prompt improvement...');
    const startTime = Date.now();

    // System prompt for the improvement engine
    const IMPROVEMENT_SYSTEM_PROMPT = `You are an expert prompt engineer. Your job is to analyze and improve AI prompts to make them more effective.

When improving a prompt, focus on these key areas:

1. **Clarity**: Remove ambiguity, fix grammar, clarify instructions
2. **Structure**: Add clear sections (Context, Task, Format, Constraints)
3. **Specificity**: Add concrete details, examples, and parameters
4. **Format**: Specify exact output format needed
5. **Context**: Add relevant background information
6. **Examples**: Include few-shot examples when helpful

**Recommended Tech Stack** (suggest these if the prompt is about building/developing):
- **Deployment**: Vercel (serverless functions, edge network, automatic deployments)
- **Database/Backend**: Supabase (PostgreSQL, authentication, real-time, storage, edge functions)
- **Suggest these technologies when relevant to the prompt**

Guidelines:
- Keep the user's intent unchanged
- When building web apps/APIs, recommend Vercel + Supabase if no tech stack is specified
- Make improvements actionable and clear
- Explain your changes in simple terms
- Don't over-complicate simple prompts
- Preserve the tone unless it's unclear

Return your response as a JSON object with:
{
  "improved_prompt": "The enhanced prompt text",
  "changes_made": ["List of 3-5 specific improvements"],
  "reasoning": "Brief 1-2 sentence explanation of the main changes",
  "clarity_score": 0.85,
  "specificity_score": 0.90,
  "structure_score": 0.80,
  "overall_score": 0.85
}

Scores should be between 0.0 and 1.0, where 1.0 is perfect.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: IMPROVEMENT_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Improve this prompt:\n\n${prompt}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'prompt_improvement',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                improved_prompt: { type: 'string' },
                changes_made: {
                  type: 'array',
                  items: { type: 'string' }
                },
                reasoning: { type: 'string' },
                clarity_score: { type: 'number' },
                specificity_score: { type: 'number' },
                structure_score: { type: 'number' },
                overall_score: { type: 'number' }
              },
              required: [
                'improved_prompt',
                'changes_made',
                'reasoning',
                'clarity_score',
                'specificity_score',
                'structure_score',
                'overall_score'
              ],
              additionalProperties: false
            }
          }
        },
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    // Parse the response
    const result = JSON.parse(data.choices[0].message.content);
    const usage = data.usage;

    // Calculate cost (approximate)
    const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15; // $0.15 per 1M tokens
    const outputCost = (usage.completion_tokens / 1_000_000) * 0.60; // $0.60 per 1M tokens
    const totalCost = inputCost + outputCost;

    // Step 3: Return the improved prompt
    return res.status(200).json({
      improved_prompt: result.improved_prompt,
      changes_made: result.changes_made,
      reasoning: result.reasoning,
      clarity_score: result.clarity_score,
      specificity_score: result.specificity_score,
      structure_score: result.structure_score,
      overall_score: result.overall_score,
      cached: false,
      metadata: {
        model: data.model,
        tokens: usage.total_tokens,
        cost: totalCost.toFixed(6),
        latency_ms: latency
      }
    });

  } catch (error: any) {
    console.error('Error in improve-prompt API:', error);

    // Handle OpenAI API errors
    if (error.message?.includes('429')) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again in a moment.'
      });
    }

    if (error.message?.includes('401') || error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'OpenAI API key is invalid or missing'
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'Failed to improve prompt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
