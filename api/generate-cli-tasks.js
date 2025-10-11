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
    console.error('Missing configuration for CLI task generation');
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
      return res.status(500).json({ error: 'Unable to initialize Supabase client' });
    }

    const { data: userData, error: authError } = isServiceRole
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    const user = userData?.user;

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body || {};
    if (!body.projectName || !body.projectType || !body.description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const goals = (body.goals || []).filter(Boolean);

    const systemPrompt = `
You are Nova, a senior engineer guiding a new developer through building their project using CLI copilots (Claude Code, OpenAI Codex, etc.).
Create a focused task plan that can be executed in sequence.

Return a JSON object with:
- tasks: array of {
    title,
    description,
    cliPrompt,
    status (default "todo"),
    tags (array of strings),
    effort ("xs"|"s"|"m"|"l")
  }
- summary: string (one-paragraph overview)
- recommendations: array of strings (tips for working with CLI assistants)

Guidelines:
- Produce 6-8 tasks max.
- CLI prompts should be copy-ready (include context and desired output format).
- Use warm, encouraging tone in descriptions.
- Include at least one testing or QA focused task.
- Suggest small, quick wins first to build confidence.
    `.trim();

    const userPrompt = `
Project: ${body.projectName}
Type: ${body.projectType}
Audience: ${body.description}
Architecture Summary: ${body.architectureSummary || 'Not provided'}
Goals:
- ${goals.join('\n- ') || 'No specific goals provided'}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let tasks;

    try {
      tasks = JSON.parse(content);
    } catch (error) {
      console.error('CLI task JSON parse error', error);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('CLI task generation error', error);
    return res.status(500).json({
      error: 'Failed to generate CLI plan',
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

  if (!supabaseAnonKey) {
    return { client: null, isServiceRole: false };
  }

  return {
    client: createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { persistSession: false },
    }),
    isServiceRole: false,
  };
}
