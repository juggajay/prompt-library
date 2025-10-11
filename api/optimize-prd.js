import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const openaiApiKey = process.env.OPENAI_API_KEY || '';

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const NOVA_SYSTEM_PROMPT = `You are **Nova**, a collaborative product-management coach who helps beginners refine Product Requirement Documents (PRDs) through natural-language chat. Approach each turn with empathy, avoid jargon, and keep explanations short but precise.

## Responsibilities
1. **Clarify:** Ask for missing context before optimizing.
2. **Analyze:** Identify gaps, inconsistencies, or risks in the provided PRD snippet.
3. **Improve:** Suggest concise rewrites, structure tweaks, and success metrics.
4. **Educate:** Explain *why* each change helps, using plain language.
5. **Iterate:** Offer next-step options and invite follow-up questions.

## Workflow
1. **User-Facing Response:**
   - **Summary (≤3 sentences)** of what you reviewed.
   - **Improvements Table** with columns: Section, Issue, Recommendation, Benefit.
   - **Suggested Rewrite** for the most critical paragraph (if applicable).
   - **Metrics & Risks:** up to 3 measurable success indicators and 2 notable risks.
   - **Next Actions:** numbered list (1–3 items) tailored for a beginner.
2. **Follow-up Prompt:** End with one targeted question to confirm the next area to refine.

## Output Format (strict JSON)
{
  "summary": "<plain-language summary>",
  "improvements": [
    {
      "section": "",
      "issue": "",
      "recommendation": "",
      "benefit": ""
    }
  ],
  "suggested_rewrite": "<markdown string or null>",
  "metrics": ["<metric 1>", "<metric 2>", "<metric 3>"],
  "risks": ["<risk 1>", "<risk 2>"],
  "next_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "follow_up_question": "<question>"
}

- Stay under 2,500 output tokens; prefer bullet lists over long prose.
- If the user uploads large text, summarize before analyzing.
- Never fabricate data; flag unknowns and request clarification.
- Keep tone supportive and instructional for new builders.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    console.error('PRD optimizer missing Supabase configuration');
    return res.status(500).json({ error: 'Supabase configuration is missing' });
  }

  if (!openai) {
    return res.status(500).json({ error: 'OpenAI is not configured' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { client: supabase, isServiceRole } = createSupabaseClient(token);
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not configured' });
    }

    const { data: userData, error: authError } = isServiceRole
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    const user = userData?.user;

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prdContent, conversationHistory = [], userMessage, sessionContext } = req.body || {};

    if (!userMessage) {
      return res.status(400).json({ error: 'Missing user message' });
    }

    // Build context message if this is the first interaction
    let contextMessage = '';
    if (sessionContext) {
      contextMessage = `\n\nSession Context:\n- PRD goal: ${sessionContext.goal || 'Not specified'}\n- Target audience: ${sessionContext.targetAudience || 'Not specified'}\n- Stage: ${sessionContext.stage || 'draft'}`;
    }

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: NOVA_SYSTEM_PROMPT },
    ];

    // Add conversation history (last 3 turns max)
    const recentHistory = conversationHistory.slice(-6); // 3 turns = 6 messages (user + assistant)
    messages.push(...recentHistory);

    // Add current user message with PRD content if provided
    let currentMessage = userMessage;
    if (prdContent) {
      currentMessage = `${userMessage}\n\nCurrent PRD Content:\n${JSON.stringify(prdContent, null, 2)}${contextMessage}`;
    } else if (contextMessage) {
      currentMessage = `${userMessage}${contextMessage}`;
    }

    messages.push({ role: 'user', content: currentMessage });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let optimizationResult;

    try {
      optimizationResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse optimization response', parseError);
      return res.status(500).json({ error: 'Failed to parse optimization response' });
    }

    const tokensUsed = completion.usage?.total_tokens ?? 0;

    return res.status(200).json({
      success: true,
      result: optimizationResult,
      tokensUsed,
    });
  } catch (error) {
    console.error('PRD optimization error:', error);
    return res.status(500).json({
      error: 'Failed to optimize PRD',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function createSupabaseClient(token) {
  const isServiceRole = Boolean(supabaseServiceKey);

  if (isServiceRole) {
    return {
      client: createClient(supabaseUrl, supabaseServiceKey),
      isServiceRole: true,
    };
  }

  return {
    client: createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }),
    isServiceRole: false,
  };
}
