import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const PROMPT_ENGINEER_AGENT = {
  name: 'prompt-engineer',
  description:
    'Expert prompt engineer specializing in advanced prompting techniques, LLM optimization, and AI system design. Masters chain-of-thought, constitutional AI, and production prompt strategies. Use when building AI features, improving agent performance, or crafting system prompts.',
  model: 'opus',
  provider: 'anthropic',
  anthropicModelId: 'claude-3-5-opus-latest',
  fallbackModelId: 'gpt-4o-mini'
} as const;

const PROMPT_ENGINEER_SYSTEM_PROMPT = `
You are ${PROMPT_ENGINEER_AGENT.name}, ${PROMPT_ENGINEER_AGENT.description}

Purpose
Expert prompt engineer specializing in advanced prompting methodologies and LLM optimization. Masters cutting-edge techniques including constitutional AI, chain-of-thought reasoning, and multi-agent prompt design. Focuses on production-ready prompt systems that are reliable, safe, and optimized for specific business outcomes.

Capabilities
- Advanced prompting techniques including chain-of-thought, least-to-most, tree-of-thought, self-consistency, and program-aided reasoning.
- Constitutional AI alignment, critique-and-revise patterns, jailbreak detection, safety prompting, and ethical guardrails.
- Meta-prompting, self-improvement workflows, auto-prompting, compression, benchmarking, and iteration frameworks.
- Model-specific optimization for OpenAI, Anthropic, and open-source models including function calling, JSON mode, temperature tuning, context management, multimodal prompting, and token efficiency.
- Production prompt systems with template management, conditional logic, localization, version control, rollback strategies, RAG optimization, hallucination reduction, and knowledge integration.
- Agent and multi-agent orchestration including persona design, collaboration patterns, task decomposition, tool selection, memory, and evaluation.
- Specialized applications across business, creative, technical, code, and evaluation domains with focus on reliability, safety, and measurable outcomes.

Behavioral Expectations
- Always display the complete prompt text, never just a description.
- Prioritize production reliability, safety, token efficiency, and empirical iteration.
- Document prompt behavior and provide clear usage guidelines.
- Consider model limitations, failure modes, ethical implications, and reproducibility.

Required Output Format
When creating any prompt, you MUST include the following sections in your response, in this exact order:
1. The Prompt
   - Present the complete improved prompt text in a single clearly marked section.
   - Place the entire prompt inside one fenced code block so it can be copied and pasted without extra characters.
2. Implementation Notes
   - Summarize key techniques used and why they were chosen.
   - Document model-specific optimizations, expected behavior, and recommended parameters (temperature, max tokens, etc.).
3. Testing & Evaluation
   - Suggest test cases and evaluation metrics, including edge cases, failure modes, and A/B testing recommendations.
4. Usage Guidelines
   - Explain when and how to use the prompt effectively, along with customization options and integration considerations.

Before completing any task, verify you have:
- Displayed the full prompt text (not just described it).
- Marked the prompt clearly with headers or code blocks.
- Provided usage instructions and implementation notes.
- Explained design choices and techniques used.
- Included testing and evaluation recommendations.
- Considered safety and ethical implications.

Scoring Guidance
Return clarity, specificity, structure, and overall scores between 0.0 and 1.0. Scores should reflect the quality of the improved prompt after refinement.

JSON Response Contract
You must return a strict JSON object with the following shape:
{
  "improved_prompt": "string containing all required sections",
  "changes_made": ["array", "of", "specific", "improvements"],
  "reasoning": "brief explanation of the main changes",
  "clarity_score": 0.85,
  "specificity_score": 0.90,
  "structure_score": 0.80,
  "overall_score": 0.88
}

The improved_prompt value must include the sections exactly as described above. Do not add extra top-level keys or formatting outside of this JSON object.
`.trim();

function normalizeScore(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
  return fallback;
}

function normalizeImprovementResult(rawResult: any, fallbackPrompt: string) {
  const improvedPrompt =
    typeof rawResult?.improved_prompt === 'string' && rawResult.improved_prompt.trim().length > 0
      ? rawResult.improved_prompt
      : fallbackPrompt;

  const changes = Array.isArray(rawResult?.changes_made)
    ? rawResult.changes_made.filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
    : [];

  return {
    improved_prompt: improvedPrompt,
    changes_made: changes,
    reasoning:
      typeof rawResult?.reasoning === 'string' && rawResult.reasoning.trim().length > 0
        ? rawResult.reasoning
        : 'Prompt improved',
    clarity_score: normalizeScore(rawResult?.clarity_score, 0.85),
    specificity_score: normalizeScore(rawResult?.specificity_score, 0.85),
    structure_score: normalizeScore(rawResult?.structure_score, 0.85),
    overall_score: normalizeScore(rawResult?.overall_score, 0.85)
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

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

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (!anthropicApiKey && !openaiApiKey) {
      return res.status(500).json({
        error: 'No AI provider configured'
      });
    }

    const providerPreference: 'anthropic' | 'openai' = anthropicApiKey ? 'anthropic' : 'openai';
    let providerUsed: 'anthropic' | 'openai' = providerPreference;

    const normalizedPrompt = prompt.trim().toLowerCase();
    const promptHash = crypto.createHash('md5').update(normalizedPrompt).digest('hex');
    void promptHash; // reserved for future caching

    const startTime = Date.now();
    console.log(
      `Calling ${providerPreference === 'anthropic' ? 'Anthropic Claude Opus' : 'OpenAI GPT-4o-mini'} for prompt improvement...`
    );

    let rawResult: any = null;
    let modelUsed =
      providerPreference === 'anthropic'
        ? PROMPT_ENGINEER_AGENT.anthropicModelId
        : PROMPT_ENGINEER_AGENT.fallbackModelId;
    let totalTokens = 0;
    let totalCost = 0;

    if (providerPreference === 'anthropic') {
      try {
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': anthropicApiKey as string,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: PROMPT_ENGINEER_AGENT.anthropicModelId,
            system: PROMPT_ENGINEER_SYSTEM_PROMPT,
            temperature: 0.3,
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Improve the following prompt while preserving the original intent. Return ONLY the JSON object described in the system message.\n\nOriginal prompt:\n${prompt}`
                  }
                ]
              }
            ]
          })
        });

        if (!anthropicResponse.ok) {
          const errorData = await anthropicResponse.json().catch(() => ({}));
          throw new Error(errorData?.error?.message || errorData?.message || 'Anthropic API request failed');
        }

        const anthropicData = await anthropicResponse.json();
        modelUsed = anthropicData.model || PROMPT_ENGINEER_AGENT.anthropicModelId;

        const contentText = Array.isArray(anthropicData.content)
          ? anthropicData.content
              .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
              .map((part: any) => part.text)
              .join('\n')
              .trim()
          : '';

        if (!contentText) {
          throw new Error('Anthropic response did not include text content');
        }

        try {
          rawResult = JSON.parse(contentText);
        } catch (parseError) {
          console.error('Failed to parse Anthropic response:', contentText);
          throw new Error('Failed to parse Anthropic response as JSON');
        }

        const inputTokens = anthropicData?.usage?.input_tokens ?? 0;
        const outputTokens = anthropicData?.usage?.output_tokens ?? 0;
        totalTokens = inputTokens + outputTokens;

        const inputCost = (inputTokens / 1_000_000) * 15;
        const outputCost = (outputTokens / 1_000_000) * 75;
        totalCost = inputCost + outputCost;
      } catch (anthropicError) {
        console.error('Anthropic improvement failed:', anthropicError);
        if (!openaiApiKey) {
          throw anthropicError;
        }
        providerUsed = 'openai';
      }
    }

    if (providerUsed === 'openai' && rawResult === null) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: PROMPT_ENGINEER_AGENT.fallbackModelId,
          messages: [
            {
              role: 'system',
              content: PROMPT_ENGINEER_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: `Improve this prompt while preserving the original intent. Return ONLY the JSON object described in the system prompt.\n\nOriginal prompt:\n${prompt}`
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
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      modelUsed = data.model || PROMPT_ENGINEER_AGENT.fallbackModelId;

      const messageContent = data?.choices?.[0]?.message?.content;
      if (!messageContent) {
        throw new Error('OpenAI response missing content');
      }

      try {
        rawResult = JSON.parse(messageContent);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', messageContent);
        throw new Error('Failed to parse OpenAI response as JSON');
      }

      const usage = data.usage || {};
      const promptTokens = usage.prompt_tokens ?? 0;
      const completionTokens = usage.completion_tokens ?? 0;
      totalTokens = usage.total_tokens ?? promptTokens + completionTokens;

      const inputCost = (promptTokens / 1_000_000) * 0.15;
      const outputCost = (completionTokens / 1_000_000) * 0.6;
      totalCost = inputCost + outputCost;
    }

    if (!rawResult) {
      throw new Error('AI provider returned an empty result');
    }

    const latency = Date.now() - startTime;
    const result = normalizeImprovementResult(rawResult, prompt);

    return res.status(200).json({
      ...result,
      cached: false,
      metadata: {
        model: modelUsed,
        tokens: totalTokens,
        cost: totalCost.toFixed(6),
        latency_ms: latency,
        agent_name: PROMPT_ENGINEER_AGENT.name,
        agent_description: PROMPT_ENGINEER_AGENT.description,
        provider: providerUsed
      }
    });
  } catch (error: any) {
    console.error('Error in improve-prompt API:', error);

    const message = typeof error?.message === 'string' ? error.message : '';

    if (message.includes('429')) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again in a moment.'
      });
    }

    if (message.includes('401') || message.includes('API key')) {
      return res.status(500).json({
        error: 'AI provider API key is invalid or missing'
      });
    }

    if (message.includes('No AI provider configured')) {
      return res.status(500).json({
        error: 'No AI provider configured'
      });
    }

    return res.status(500).json({
      error: 'Failed to improve prompt',
      details: process.env.NODE_ENV === 'development' ? message : undefined
    });
  }
}
