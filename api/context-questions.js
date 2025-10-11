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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!openai || !supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    console.error('Context questions endpoint misconfigured');
    return res.status(500).json({ error: 'Server configuration incomplete' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { client: supabase, isServiceRole } = createSupabaseClient(token);

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client unavailable' });
    }

    const { data: userData, error: authError } = isServiceRole
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    if (authError || !userData?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idea = typeof req.body?.idea === 'string' ? req.body.idea.trim() : '';
    if (!idea) {
      return res.status(400).json({ error: 'Idea is required' });
    }

    const systemPrompt = `
You are a senior product engineer helping a beginner clarify their project idea.
Return exactly three short, beginner-friendly clarification questions that unlock the most important requirements.

Respond in strict JSON with shape:
{
  "questions": [
    { "id": "audience", "question": "...", "helper": "..." },
    ...
  ]
}

Rules:
- Keep questions short (max 18 words).
- helper is optional, use to give an explanatory hint (max 12 words).
- Avoid jargon.
- Focus on what will meaningfully change technical decisions (platform, users, monetization, integration, content scope).
`.trim();

    const userPrompt = `Project idea: """${idea}"""`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const contentText = completion.choices[0]?.message?.content || '{}';
    let parsed;

    try {
      parsed = JSON.parse(contentText);
    } catch (error) {
      console.error('Failed to parse clarifying questions JSON', error);
      parsed = null;
    }

    const questions = Array.isArray(parsed?.questions) && parsed.questions.length > 0
      ? parsed.questions.slice(0, 3).map((item, index) => ({
          id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id : `q${index + 1}`,
          question: typeof item.question === 'string' && item.question.trim().length > 0
            ? item.question.trim()
            : fallbackQuestions(idea)[index].question,
          helper: typeof item.helper === 'string' && item.helper.trim().length > 0
            ? item.helper.trim()
            : undefined,
        }))
      : fallbackQuestions(idea);

    return res.status(200).json(questions);
  } catch (error) {
    console.error('Context questions error', error);
    return res.status(500).json({ error: 'Failed to generate questions' });
  }
}

function fallbackQuestions(idea) {
  return [
    {
      id: 'audience',
      question: 'Who will actually use this and what problem does it solve for them?',
      helper: 'Think about the specific people you have in mind.',
    },
    {
      id: 'must-have',
      question: 'What is the single most important thing the first version must do?',
      helper: 'Imagine the core moment of value.',
    },
    {
      id: 'platform',
      question: 'Where should people access this first (web app, mobile, desktop, other)?',
      helper: 'Pick one primary platform to start.',
    },
  ];
}

function createSupabaseClient(token) {
  const isServiceRole = Boolean(supabaseServiceKey);

  if (isServiceRole) {
    return {
      client: createClient(supabaseUrl, supabaseServiceKey),
      isServiceRole: true,
    };
  }

  if (!supabaseAnonKey) {
    return { client: null, isServiceRole: false };
  }

  return {
    client: createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: { persistSession: false },
    }),
    isServiceRole: false,
  };
}
