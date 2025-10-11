-- Project Blueprint schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS project_blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  goal TEXT,
  audience TEXT,
  stage TEXT DEFAULT 'draft',
  architecture JSONB DEFAULT '{}'::jsonb,
  overview JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID REFERENCES project_blueprints(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cli_prompt TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blueprints_user_id ON project_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_blueprint_id ON project_tasks(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);

-- Row Level Security
ALTER TABLE project_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view their blueprints" ON project_blueprints;
CREATE POLICY "Users view their blueprints"
  ON project_blueprints FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their blueprints" ON project_blueprints;
CREATE POLICY "Users insert their blueprints"
  ON project_blueprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their blueprints" ON project_blueprints;
CREATE POLICY "Users update their blueprints"
  ON project_blueprints FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their blueprints" ON project_blueprints;
CREATE POLICY "Users delete their blueprints"
  ON project_blueprints FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their project tasks" ON project_tasks;
CREATE POLICY "Users view their project tasks"
  ON project_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their project tasks" ON project_tasks;
CREATE POLICY "Users insert their project tasks"
  ON project_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their project tasks" ON project_tasks;
CREATE POLICY "Users update their project tasks"
  ON project_tasks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their project tasks" ON project_tasks;
CREATE POLICY "Users delete their project tasks"
  ON project_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_blueprints_updated_at ON project_blueprints;
CREATE TRIGGER update_project_blueprints_updated_at
  BEFORE UPDATE ON project_blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
