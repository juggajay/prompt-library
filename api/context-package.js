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
    console.error('Context package endpoint misconfigured');
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
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

    if (!idea) {
      return res.status(400).json({ error: 'Project idea is required' });
    }

    const condensedAnswers = answers
      .filter((entry) => typeof entry?.answer === 'string' && entry.answer.trim().length > 0)
      .map((entry) => ({
        id: entry.id || 'unknown',
        question: entry.question || '',
        answer: entry.answer.trim(),
      }));

    const preferences = typeof req.body?.preferences === 'object' && req.body.preferences !== null
      ? req.body.preferences
      : {};

    const systemPrompt = `
You are Nova, a senior product engineer creating a comprehensive project context bundle for a beginner using AI coding tools.

Return strict JSON with this exact schema:
{
  "project": {
    "name": "string",
    "type": "string",
    "target_audience": "string"
  },
  "summary": "string",
  "assumptions": ["string", ...],
  "decisions": {
    "tech_stack": ["string", ...],
    "integrations": ["string", ...],
    "quality": ["string", ...],
    "notes": ["string", ...]
  },
  "files": [
    {
      "id": "kebab-case id",
      "title": "string",
      "filename": "kebab-case.md",
      "purpose": "string describing the intent of the file",
      "content": "markdown content"
    }
  ],
  "prompts": [
    {
      "title": "string",
      "instructions": "string (how to use this prompt)",
      "prompt": "string ready to paste into an AI assistant"
    }
  ],
  "next_steps": ["string", ...]
}

Guidelines:
- Include at least these markdown files: project-overview, product-spec, technical-architecture, ai-guidelines, task-roadmap.
- content must be detailed markdown using headings, bullet lists, and code fences where helpful.
- Ensure decisions align with the project description and user answers.
- Keep tone supportive and beginner-friendly.
- prompts should each focus on a specific coding task and reference the relevant file names.
`.trim();

    const answerSummary = condensedAnswers
      .map((entry) => `Q: ${entry.question || entry.id}\nA: ${entry.answer}`)
      .join('\n\n');

    const userPrompt = `
Project idea:
${idea}

Clarifications:
${answerSummary || 'No additional answers were provided.'}

Additional preferences:
${JSON.stringify(preferences, null, 2)}
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

    const contentText = completion.choices[0]?.message?.content || '{}';
    let parsed;

    try {
      parsed = JSON.parse(contentText);
    } catch (error) {
      console.error('Failed to parse context package JSON', error);
      parsed = null;
    }

    if (!parsed) {
      return res.status(500).json({ error: 'Failed to generate context package' });
    }

    const project = parsed.project || {};
    const decisions = parsed.decisions || {};

    const files = Array.isArray(parsed.files) ? parsed.files : [];
    const prompts = Array.isArray(parsed.prompts) ? parsed.prompts : [];

    const contextPayload = {
      packageId: undefined,
      summary: typeof parsed.summary === 'string' ? parsed.summary : idea,
      projectName:
        typeof project.name === 'string' && project.name.trim().length > 0
          ? project.name.trim()
          : 'Untitled Project',
      projectType:
        typeof project.type === 'string' && project.type.trim().length > 0
          ? project.type.trim()
          : 'other',
      targetAudience:
        typeof project.target_audience === 'string' && project.target_audience.trim().length > 0
          ? project.target_audience.trim()
          : 'General audience',
      assumptions: Array.isArray(parsed.assumptions) && parsed.assumptions.length
        ? parsed.assumptions.map(String)
        : ['Assumed standard web application unless specified otherwise.'],
      decisions: {
        techStack: Array.isArray(decisions.tech_stack) ? decisions.tech_stack.map(String) : [],
        integrations: Array.isArray(decisions.integrations) ? decisions.integrations.map(String) : [],
        quality: Array.isArray(decisions.quality) ? decisions.quality.map(String) : [],
        notes: Array.isArray(decisions.notes) ? decisions.notes.map(String) : [],
      },
      files: files.map((file, index) => ({
        id: typeof file.id === 'string' && file.id.trim().length > 0 ? file.id.trim() : `file-${index + 1}`,
        title: typeof file.title === 'string' ? file.title.trim() : `Context File ${index + 1}`,
        filename: typeof file.filename === 'string' ? file.filename.trim() : `context-${index + 1}.md`,
        purpose: typeof file.purpose === 'string'
          ? file.purpose.trim()
          : 'Provide guidance for the AI assistant.',
        content: typeof file.content === 'string'
          ? file.content
          : `# ${file.title || 'Context'}\n\nContent will be refined.`,
      })),
      prompts: prompts.map((prompt, index) => ({
        title: typeof prompt.title === 'string' ? prompt.title.trim() : `Prompt ${index + 1}`,
        instructions: typeof prompt.instructions === 'string'
          ? prompt.instructions.trim()
          : 'Copy this into your AI assistant after reviewing the context files.',
        prompt: typeof prompt.prompt === 'string' ? prompt.prompt : '',
      })),
      nextSteps: Array.isArray(parsed.next_steps) ? parsed.next_steps.map(String) : [],
    };

    return res.status(200).json(contextPayload);
  } catch (error) {
    console.error('Context package error', error);
    return res.status(500).json({ error: 'Failed to generate context package' });
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: { persistSession: false },
    }),
    isServiceRole: false,
  };
}
