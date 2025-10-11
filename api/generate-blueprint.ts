import './_lib/loadEnv';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

interface BlueprintRequestBody {
  projectName: string;
  projectType: string;
  description: string;
  targetAudience: string;
  goals: string[];
  constraints?: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!openai || !supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    console.error('Missing configuration for blueprint generation');
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

    const body = (req.body || {}) as BlueprintRequestBody;
    if (!body.projectName || !body.projectType || !body.description || !body.targetAudience) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const goals = (body.goals || []).filter(Boolean);
    const constraints = (body.constraints || []).filter(Boolean);

    const systemPrompt = `
You are Nova, a friendly senior product engineer mentoring a new developer.
Generate an architecture starter kit for the project. Keep explanations supportive and concise, avoid jargon.

Return a JSON object with:
- architecture.summary (string)
- architecture.components (array of { name, responsibility, notes })
- architecture.dataFlow (array of { step, detail })
- architecture.techStack (array of strings)
- architecture.recommendations (array of { title, description })
- nextSteps (array of strings)
- cliPrompts (array of { label, command, notes })

Guidelines:
- Assume the developer will copy prompts into CLI copilots (Claude Code, Codex).
- Highlight 4-6 core components max.
- Data flow should be linear, beginner-friendly steps.
- Tech stack items should match the project type and stay within modern, well-supported tools.
- Commands should reference npm/yarn, supabase, or vercel where relevant.
- Keep JSON compact but readable.
    `.trim();

    const userPrompt = `
Project Name: ${body.projectName}
Project Type: ${body.projectType}
Audience: ${body.targetAudience}
Description: ${body.description}
Goals:
- ${goals.join('\n- ') || 'No specific goals provided'}

Constraints:
- ${constraints.join('\n- ') || 'No constraints provided'}
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
    let blueprint: Record<string, unknown>;

    try {
      blueprint = JSON.parse(content);
    } catch (error) {
      console.error('Blueprint JSON parse error', error);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    let blueprintId: string | undefined;
    try {
      const { data: record, error: insertError } = await supabase
        .from('project_blueprints')
        .insert({
          user_id: user.id,
          title: body.projectName,
          goal: goals.join('\n'),
          audience: body.targetAudience,
          stage: 'draft',
          architecture: blueprint.architecture ?? {},
          overview: {
            description: body.description,
            goals,
            constraints,
          },
        })
        .select('id')
        .single();

      if (insertError) {
        console.warn('Failed to persist blueprint', insertError);
      } else {
        blueprintId = record?.id;
      }
    } catch (dbError) {
      console.warn('Unexpected error inserting blueprint', dbError);
    }

    return res.status(200).json({
      blueprintId,
      ...blueprint,
    });
  } catch (error) {
    console.error('Blueprint generation error', error);
    return res.status(500).json({
      error: 'Failed to generate project blueprint',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function createSupabaseClient(token: string) {
  const isServiceRole = Boolean(supabaseServiceKey);

  if (isServiceRole) {
    return {
      client: createClient(supabaseUrl, supabaseServiceKey),
      isServiceRole: true,
    } as const;
  }

  if (!supabaseAnonKey) {
    return { client: null, isServiceRole: false } as const;
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
  } as const;
}
