import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
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

    // Get complete session data
    const { data: session, error: sessionFetchError } = await supabase
      .from('rule_generation_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionFetchError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate rules based on all collected information
    const rulesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert at generating project-specific development rules and guidelines.

Based on the project information and user responses, generate comprehensive rules organized by category.

Return JSON with this structure:
{
  "rules": {
    "code_style": [
      {
        "id": "cs1",
        "title": "Use Functional Components",
        "description": "All React components must use functional components with hooks",
        "rationale": "Functional components are the modern React standard...",
        "priority": "P1",
        "enforcement": "eslint",
        "example": "const MyComponent = () => { ... }"
      }
    ],
    "security": [...],
    "performance": [...],
    "testing": [...],
    "architecture": [...],
    "compliance": [...]
  },
  "config_files": {
    ".eslintrc.js": "module.exports = {...}",
    ".prettierrc": "{...}",
    "tsconfig.json": "{...}"
  },
  "recommended_tools": ["tool1", "tool2"],
  "next_steps": ["Step 1", "Step 2"]
}

Priority levels:
- P0: Critical (security, data loss) - blocks deployment
- P1: High (quality, performance) - fix within sprint
- P2: Medium (style, minor issues) - fix within 2 sprints
- P3: Low (formatting) - fix when convenient`
          },
          {
            role: 'user',
            content: `Generate project-specific rules:

Project Type: ${session.project_type}
Technologies: ${JSON.stringify(session.detected_technologies)}
User Responses: ${JSON.stringify(session.user_responses, null, 2)}

Create comprehensive, actionable rules that:
1. Match the specific tech stack
2. Address the scale and requirements mentioned
3. Include compliance rules if applicable
4. Provide concrete examples
5. Explain WHY each rule matters`
          }
        ]
      }),
    });

    if (!rulesResponse.ok) {
      const errorData = await rulesResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to generate rules');
    }

    const rulesData = await rulesResponse.json();
    const generatedRules = JSON.parse(rulesData.choices[0].message.content || '{}');

    // Count total rules
    const totalRules = Object.values(generatedRules.rules || {})
      .reduce((sum: number, categoryRules: any) => sum + (categoryRules?.length || 0), 0);

    // Save rules to session
    const { error: updateError } = await supabase
      .from('rule_generation_sessions')
      .update({
        status: 'completed',
        generated_rules: generatedRules,
        rule_categories: Object.keys(generatedRules.rules || {}),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Session update error:', updateError);
      throw updateError;
    }

    // Create final message
    await supabase.from('rule_conversation_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: `🎉 I've generated ${totalRules} customized rules for your project!

Rules cover: ${Object.keys(generatedRules.rules || {}).join(', ')}

You can now review, customize, and apply these rules to your prompt.`
    });

    return res.status(200).json({
      success: true,
      rules: generatedRules,
      totalRules,
      categories: Object.keys(generatedRules.rules || {})
    });

  } catch (error: any) {
    console.error('Rule generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate rules',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
