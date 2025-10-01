import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptId, promptContent, userId } = req.body;

    if (!promptContent || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Analyze the prompt to understand what they're building
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a project analysis expert. Analyze the user's prompt to understand what they're building.

Extract:
1. project_type: web_app, mobile_app, api, cli_tool, data_pipeline, desktop_app, ai_agent, or other
2. detected_technologies: Array of detected frameworks, languages, tools (e.g., ["React", "Node.js", "PostgreSQL"])
3. detected_requirements: Array of inferred requirements (e.g., ["authentication", "payment_processing", "real_time_updates"])
4. industry: If mentioned (e.g., "healthcare", "finance", "e-commerce")
5. scale_indicators: Words suggesting scale (e.g., "10000 users", "enterprise", "small team")
6. confidence: Your confidence in the analysis (0.0 to 1.0)
7. missing_critical_info: Array of important things not mentioned that you MUST ask about

Return JSON with these fields.`
          },
          {
            role: 'user',
            content: `Analyze this prompt:\n\n${promptContent}`
          }
        ]
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error('Failed to analyze prompt');
    }

    const analysisData = await analysisResponse.json();
    const analysis = JSON.parse(analysisData.choices[0].message.content || '{}');

    // Step 2: Generate initial questions based on analysis
    const questionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert at asking smart questions to understand project requirements.

Based on the project analysis, generate 5-7 targeted questions. Questions should:
- Be specific to the detected project type
- Fill critical gaps in understanding
- Be answerable in 1-2 sentences or multiple choice
- Have clear purpose explained

Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "The question text",
      "category": "technical" | "functional" | "business" | "compliance",
      "reasoning": "Why we're asking this",
      "type": "text" | "choice" | "number",
      "options": ["Option 1", "Option 2"],
      "priority": "required" | "important" | "optional"
    }
  ],
  "estimated_time": "3-5 minutes"
}`
          },
          {
            role: 'user',
            content: `Project Analysis: ${JSON.stringify(analysis, null, 2)}

Generate smart, adaptive questions to understand:
- Missing critical information
- Technical environment details
- Scale and compliance requirements
- Team workflow preferences`
          }
        ]
      }),
    });

    if (!questionResponse.ok) {
      throw new Error('Failed to generate questions');
    }

    const questionData = await questionResponse.json();
    const questions = JSON.parse(questionData.choices[0].message.content || '{}');

    // Step 3: Create session in database
    const { data: session, error: sessionError } = await supabase
      .from('rule_generation_sessions')
      .insert({
        prompt_id: promptId,
        user_id: userId,
        status: 'in_progress',
        project_type: analysis.project_type,
        detected_technologies: analysis.detected_technologies,
        confidence_score: analysis.confidence,
        total_questions: questions.questions?.length || 0,
        questions_asked: questions.questions
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw sessionError;
    }

    // Step 4: Save initial AI message
    await supabase.from('rule_conversation_messages').insert({
      session_id: session.id,
      role: 'assistant',
      content: `I've analyzed your prompt and detected you're building a **${analysis.project_type.replace('_', ' ')}** ${
        analysis.detected_technologies.length > 0
          ? `using ${analysis.detected_technologies.slice(0, 3).join(', ')}`
          : ''
      }.

To generate the best project-specific rules, I need to ask you ${questions.questions?.length || 0} quick questions. This will take about ${questions.estimated_time}.

Let's start! 🚀`,
      question_data: {
        isInitial: true,
        analysis: analysis,
        upcomingQuestions: questions.questions?.length || 0
      }
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      analysis,
      questions: questions.questions,
      firstQuestion: questions.questions?.[0],
      estimatedTime: questions.estimated_time
    });

  } catch (error: any) {
    console.error('Prompt analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze prompt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
