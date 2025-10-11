import { createClient } from '@supabase/supabase-js';

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

const DEFAULT_TEMPLATES = [
  {
    id: 'default-web-app',
    name: 'Web App Starter',
    project_type: 'web_app',
    description: 'Friendly blueprint for building your first web application PRD.',
    structure: {
      sections: [
        'Executive Summary',
        'Audience & Goals',
        'Core Features',
        'Nice-to-have Ideas',
        'Technical Notes',
        'Launch Checklist',
      ],
    },
    variables: ['app_name', 'target_users', 'core_features', 'tech_stack'],
    is_public: true,
  },
  {
    id: 'default-mobile-app',
    name: 'Mobile App Starter',
    project_type: 'mobile_app',
    description: 'Guided outline made for mobile-first projects.',
    structure: {
      sections: [
        'App Concept',
        'User Personas',
        'Key Screens',
        'Mobile-specific Features',
        'Offline Experience',
        'Success Metrics',
      ],
    },
    variables: ['app_name', 'platforms', 'key_features', 'target_devices'],
    is_public: true,
  },
  {
    id: 'default-api-service',
    name: 'API Service Starter',
    project_type: 'api',
    description: 'Simple structure for planning a beginner-friendly API.',
    structure: {
      sections: [
        'Service Overview',
        'Main Use Cases',
        'Endpoints',
        'Authentication',
        'Error Handling',
        'Monitoring Plan',
      ],
    },
    variables: ['service_name', 'api_consumers', 'endpoints', 'auth_method'],
    is_public: true,
  },
];

export default async function handler(req, res) {
  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    console.error('PRD templates missing Supabase configuration');
    return res.status(500).json({ error: 'Supabase configuration is missing' });
  }

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

  if (req.method === 'GET') {
    try {
      const { data: templates, error } = await supabase
        .from('prd_templates')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Template fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch templates' });
      }

      if (!templates || templates.length === 0) {
        return res.status(200).json({
          templates: DEFAULT_TEMPLATES,
          isDefault: true,
        });
      }

      return res.status(200).json({
        templates,
        isDefault: false,
      });
    } catch (error) {
      console.error('Template fetch exception:', error);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, project_type, structure, variables, is_public = false } =
        req.body || {};

      if (!name || !project_type || !structure) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const insertPayload = {
        name,
        description: description || '',
        project_type,
        structure,
        variables: Array.isArray(variables) ? variables : [],
        is_public: Boolean(is_public),
        created_by: user.id,
      };

      const { data: template, error } = await supabase
        .from('prd_templates')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error('Template creation error:', error);
        return res.status(500).json({ error: 'Failed to create template' });
      }

      return res.status(201).json({ template });
    } catch (error) {
      console.error('Template creation exception:', error);
      return res.status(500).json({ error: 'Failed to create template' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
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
      auth: { persistSession: false },
    }),
    isServiceRole: false,
  };
}
