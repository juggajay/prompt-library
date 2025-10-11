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

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    console.error('PRD generator missing Supabase configuration');
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

    const payload = req.body || {};
    if (!payload.projectName || !payload.projectType || !payload.description || !payload.targetAudience) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const requirements = payload.requirements || {
      functional: [],
      nonFunctional: [],
      technical: [],
    };

    const cleanedRequirements = {
      functional: (requirements.functional || []).map((item) => item.trim()).filter(Boolean),
      nonFunctional: (requirements.nonFunctional || []).map((item) => item.trim()).filter(Boolean),
      technical: (requirements.technical || []).map((item) => item.trim()).filter(Boolean),
    };

    const startTime = Date.now();

    const systemPrompt = `You are an expert product manager creating comprehensive product requirements documents for beginners.
Return a friendly yet thorough JSON object with clearly labeled sections that a new product builder can understand.

IMPORTANT: All content should be in natural language paragraphs and readable sentences, not just bullet points or technical lists.

Required top-level keys:
- executiveSummary (string - 2-3 paragraph summary in natural language)
- projectOverview (string - detailed paragraph describing the project)
- goalsAndObjectives (string - paragraph explaining the main goals and objectives)
- targetUsers (string - paragraph describing who will use this and their needs)
- userStories (string - narrative paragraph describing key user scenarios and workflows)
- functionalRequirements (string - detailed paragraph explaining what the system must do)
- nonFunctionalRequirements (string - paragraph covering performance, security, scalability needs)
- technicalArchitecture (string - comprehensive paragraph describing the tech stack, architecture approach, integrations, and deployment strategy)
- successMetrics (string - paragraph explaining how success will be measured)
- timeline (string - paragraph outlining the project phases and timeline)
- risksAndMitigation (string - paragraph discussing potential risks and how to address them)

Keep the tone supportive, use natural language, and write in complete sentences and paragraphs.`;

    const requirementList = [
      ...cleanedRequirements.functional.map((item) => `- Functional: ${item}`),
      ...cleanedRequirements.nonFunctional.map((item) => `- Non-functional: ${item}`),
      ...cleanedRequirements.technical.map((item) => `- Technical: ${item}`),
    ].join('\n') || '- None provided';

    const userPrompt = `Create a PRD with the required JSON structure.
Project name: ${payload.projectName}
Project type: ${payload.projectType}
Project description: ${payload.description}
Target audience: ${payload.targetAudience}
Timeline clue: ${payload.timeline || 'Not specified'}
Requirements:
${requirementList}

If you need to invent details, pick reasonable beginner-friendly defaults.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const contentText = completion.choices[0]?.message?.content || '{}';
    let generatedContent;
    try {
      generatedContent = JSON.parse(contentText);
    } catch (parseError) {
      console.error('Failed to parse PRD content, falling back to default shape', parseError);
      generatedContent = {
        executiveSummary: 'Summary coming soon.',
        projectOverview: payload.description,
        goalsAndObjectives: 'Goals and objectives will be defined based on project requirements.',
        targetUsers: payload.targetAudience,
        userStories: 'User stories will be developed as the project requirements are refined.',
        functionalRequirements: cleanedRequirements.functional.length > 0
          ? 'The system must: ' + cleanedRequirements.functional.join('. ') + '.'
          : 'Functional requirements will be defined based on project scope.',
        nonFunctionalRequirements: cleanedRequirements.nonFunctional.length > 0
          ? 'The system should meet these non-functional requirements: ' + cleanedRequirements.nonFunctional.join('. ') + '.'
          : 'Non-functional requirements will be defined based on quality and performance needs.',
        technicalArchitecture: 'Technical architecture details will be determined during the design phase.',
        successMetrics: 'Success metrics will be defined to measure project outcomes and user satisfaction.',
        timeline: payload.timeline || 'Timeline will be determined based on project scope and resource availability.',
        risksAndMitigation: 'Risks and mitigation strategies will be identified and managed throughout the project lifecycle.',
      };
    }

    const tokensUsed = completion.usage?.total_tokens ?? 0;
    const generationTimeMs = Date.now() - startTime;

    const { data: prdDocument, error: saveError } = await supabase
      .from('prd_documents')
      .insert({
        user_id: user.id,
        prompt_id: payload.promptId || null,
        template_id: payload.templateId || null,
        title: `${payload.projectName} — Product Requirements Document`,
        project_name: payload.projectName,
        project_type: payload.projectType,
        content: generatedContent,
        metadata: {
          description: payload.description,
          targetAudience: payload.targetAudience,
          requirements: cleanedRequirements,
          timeline: payload.timeline || null,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to store PRD', saveError);
      return res.status(500).json({ error: 'Failed to save PRD' });
    }

    const { error: historyError } = await supabase.from('prd_generation_history').insert({
      user_id: user.id,
      prd_document_id: prdDocument.id,
      prompt_id: payload.promptId || null,
      generation_params: {
        ...payload,
        requirements: cleanedRequirements,
      },
      ai_model: 'gpt-4o-mini',
      tokens_used: tokensUsed,
      generation_time_ms: generationTimeMs,
    });

    if (historyError) {
      console.warn('Failed to log PRD history', historyError);
    }

    return res.status(200).json({
      success: true,
      document: prdDocument,
      meta: {
        tokensUsed,
        generationTimeMs,
      },
    });
  } catch (error) {
    console.error('PRD generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate PRD',
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
