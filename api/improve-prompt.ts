import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const PROMPT_ENGINEER_AGENT = {
  name: 'prompt-engineer',
  description:
    'Expert prompt engineer specializing in advanced prompting techniques, LLM optimization, and AI system design. Masters chain-of-thought, constitutional AI, and production prompt strategies. Use when building AI features, improving agent performance, or crafting system prompts.',
  model: 'gpt-4o'
} as const;

const PROMPT_ENGINEER_SYSTEM_PROMPT = `
You are ${PROMPT_ENGINEER_AGENT.name}, ${PROMPT_ENGINEER_AGENT.description}

Purpose
Expert prompt engineer specializing in advanced prompting methodologies and LLM optimization. Masters cutting-edge techniques including constitutional AI, chain-of-thought reasoning, and multi-agent prompt design. Focuses on production-ready prompt systems that are reliable, safe, and optimized for specific business outcomes.

Core Capabilities
- Advanced prompting techniques: chain-of-thought, least-to-most, tree-of-thought, self-consistency, program-aided reasoning
- Constitutional AI: alignment, critique-and-revise patterns, jailbreak detection, safety prompting, ethical guardrails
- Meta-prompting: self-improvement workflows, auto-prompting, compression, benchmarking, iteration frameworks
- Model optimization: function calling, JSON mode, temperature tuning, context management, multimodal prompting, token efficiency
- Production systems: template management, conditional logic, localization, version control, rollback strategies, RAG optimization
- Agent orchestration: persona design, collaboration patterns, task decomposition, tool selection, memory management
- Domain expertise: business, creative, technical, code generation, and evaluation with focus on reliability and measurable outcomes
- You must always deliver an enhanced prompt. Never return the original prompt verbatim. If the source content is already strong, push the quality further by tightening language, enriching context, restructuring format, or adding evaluation criteria so the improvement is unmistakable.

Your Improvement Process
1. Analyze the original prompt for clarity, structure, specificity, context, constraints, and output format
2. Apply advanced prompting techniques appropriate to the use case
3. Enhance with clear structure, concrete examples, and specific instructions
4. Add context, constraints, and format specifications where beneficial
5. Optimize for the target model and use case
6. Ensure safety, reliability, and production-readiness

When Improving Prompts
- Preserve the user's original intent and tone
- Add structure with clear sections (Context, Task, Format, Constraints) when helpful
- Include concrete examples (few-shot prompting) when they improve understanding
- Specify exact output format requirements
- Add relevant context and background information
- Consider edge cases and failure modes
- Optimize for clarity, specificity, and effectiveness
- Don't over-complicate simple prompts, but still make incremental clarity or formatting upgrades so the output differs from the input
- Apply appropriate advanced techniques (CoT, self-consistency, etc.) based on complexity
- Document 3-6 concrete improvements in the changes_made list, focusing on measurable upgrades (structure, clarity, context, safety, format, examples, evaluation criteria, etc.)

Output Structure for improved_prompt
Your improved prompt should be comprehensive and production-ready. Structure it with clear markdown formatting:

# [Title or Purpose]
[Brief context or overview]

## Context
[Relevant background information]

## Task
[Clear, specific instructions]

## Format
[Expected output format with examples or schema]

## Constraints
[Important limitations, guardrails, and safety requirements]

## Evaluation
[Quality criteria, success checks, or reviewer checklist]

## Examples (if helpful)
[Few-shot examples demonstrating desired behavior]

Note: Adapt this structure based on the prompt's complexity. Simple prompts may not need every subsection, but the rewritten prompt must still be more structured than the original.

Scoring Guidance
Provide honest scores (0.0-1.0) reflecting the improved prompt's quality:
- clarity_score: How clear and unambiguous the instructions are
- specificity_score: Level of concrete detail and precise requirements
- structure_score: Organization, formatting, and logical flow
- overall_score: Holistic quality assessment

JSON Response Contract
Return a strict JSON object:
{
  "improved_prompt": "The complete improved prompt with markdown formatting and all relevant sections",
  "changes_made": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3", "etc."],
  "reasoning": "1-2 sentence explanation of the main improvements and techniques applied",
  "clarity_score": 0.85,
  "specificity_score": 0.90,
  "structure_score": 0.80,
  "overall_score": 0.88
}
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

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

async function requestImprovement(
  prompt: string,
  apiKey: string,
  attempt: number
): Promise<{ rawResult: any; model: string; usage: OpenAIUsage }> {
  const retrySuffix =
    attempt > 1
      ? '\n\nImportant: The previous attempt did not provide a meaningfully different prompt. Produce a significantly improved version with new structure, refined language, explicit evaluation criteria, and concrete adjustments. DO NOT repeat large portions of the original text verbatim.'
      : '';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: PROMPT_ENGINEER_AGENT.model,
      messages: [
        {
          role: 'system',
          content: PROMPT_ENGINEER_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Improve this prompt while preserving the original intent. Return ONLY the JSON object described in the system prompt.\n\nOriginal prompt:\n${prompt}${retrySuffix}`
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
  const messageContent = data?.choices?.[0]?.message?.content;

  if (!messageContent) {
    throw new Error('OpenAI response missing content');
  }

  let rawResult: any;
  try {
    rawResult = JSON.parse(messageContent);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', messageContent);
    throw new Error('Failed to parse OpenAI response as JSON');
  }

  const usage = data.usage || {};
  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  const totalTokens = usage.total_tokens ?? promptTokens + completionTokens;

  return {
    rawResult,
    model: data.model || PROMPT_ENGINEER_AGENT.model,
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens
    }
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

    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured'
      });
    }

    const normalizedPrompt = prompt.trim().toLowerCase();
    const promptHash = crypto.createHash('md5').update(normalizedPrompt).digest('hex');
    void promptHash; // reserved for future caching

    const startTime = Date.now();
    console.log('Calling OpenAI GPT-4o for prompt improvement...');

    const MAX_ATTEMPTS = 2;
    let attempt = 1;
    let attemptsUsed = 0;
    let latestModel = PROMPT_ENGINEER_AGENT.model;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let finalResult: ReturnType<typeof normalizeImprovementResult> | null = null;

    while (attempt <= MAX_ATTEMPTS) {
      console.log(`Prompt improvement attempt ${attempt}`);
      const improvement = await requestImprovement(prompt, openaiApiKey, attempt);

      latestModel = improvement.model;
      totalPromptTokens += improvement.usage.prompt_tokens;
      totalCompletionTokens += improvement.usage.completion_tokens;
      totalTokens += improvement.usage.total_tokens;

      const candidate = normalizeImprovementResult(improvement.rawResult, prompt);
      attemptsUsed = attempt;

      if (candidate.improved_prompt.trim() !== prompt.trim()) {
        finalResult = candidate;
        break;
      }

      if (attempt === MAX_ATTEMPTS) {
        console.warn('AI returned a prompt without detectable improvements after maximum retries.');
        finalResult = candidate;
        break;
      }

      console.warn('AI returned a prompt without sufficient changes. Retrying with stronger instructions.');
      attempt += 1;
    }

    if (!finalResult) {
      throw new Error('AI did not return an improved prompt');
    }

    const inputCost = (totalPromptTokens / 1_000_000) * 5; // $5.00 per 1M tokens
    const outputCost = (totalCompletionTokens / 1_000_000) * 15; // $15.00 per 1M tokens
    const totalCost = inputCost + outputCost;

    const latency = Date.now() - startTime;

    return res.status(200).json({
      ...finalResult,
      cached: false,
      metadata: {
        model: latestModel,
        tokens: totalTokens,
        cost: totalCost.toFixed(6),
        latency_ms: latency,
        agent_name: PROMPT_ENGINEER_AGENT.name,
        agent_description: PROMPT_ENGINEER_AGENT.description,
        provider: 'openai',
        attempts: attemptsUsed
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
        error: 'OpenAI API key is invalid or missing'
      });
    }

    return res.status(500).json({
      error: 'Failed to improve prompt',
      details: process.env.NODE_ENV === 'development' ? message : undefined
    });
  }
}
