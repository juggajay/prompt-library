# Prompt Library - Setup Guide

This guide will help you set up the Prompt Library application with all its features.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- An OpenAI API key (optional, for AI features)

## 1. Environment Variables Setup

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

### Required Variables

#### Supabase Configuration
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select an existing one
3. Go to Settings > API
4. Copy your project URL and anon key
5. Update `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### OpenAI API Key (Optional)
If you want AI features (auto-categorization, auto-tagging, quality scoring):

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env.local`:

```env
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

**Note**: The app works without OpenAI - AI features will simply be disabled.

## 2. Database Setup

Run these SQL commands in your Supabase SQL Editor (Dashboard > SQL Editor):

### Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8b5cf6',
  parent_folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Other',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  parent_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  ai_category TEXT,
  ai_tags TEXT[],
  quality_score INTEGER,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_is_favorite ON prompts(is_favorite);
CREATE INDEX idx_folders_user_id ON folders(user_id);

-- Create full-text search
ALTER TABLE prompts ADD COLUMN search_vector tsvector;
CREATE INDEX idx_prompts_search ON prompts USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.prompt_text, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompts_search_update
BEFORE INSERT OR UPDATE ON prompts
FOR EACH ROW EXECUTE FUNCTION update_search_vector();
```

### Create Functions

```sql
-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage(prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE prompts
  SET use_count = use_count + 1,
      last_used_at = NOW()
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for semantic search (if using embeddings)
CREATE OR REPLACE FUNCTION match_prompts(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  prompt_text TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    prompts.id,
    prompts.title,
    prompts.prompt_text,
    1 - (prompts.embedding <=> query_embedding) AS similarity
  FROM prompts
  WHERE 1 - (prompts.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Folders policies
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Prompts policies
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);
```

### Create Trigger for Profile Creation

```sql
-- Automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 5. Build for Production

```bash
npm run build
npm run preview
```

## Features Overview

### Core Features
- ✅ User authentication (signup/login)
- ✅ Create, read, update, delete prompts
- ✅ Search prompts (full-text search)
- ✅ Filter by category, tags, favorites
- ✅ Mark prompts as favorites
- ✅ Track usage statistics

### AI Features (requires OpenAI API key)
- ✅ Auto-categorize prompts
- ✅ Auto-generate tags
- ✅ Quality scoring (0-100)
- ✅ Embeddings for semantic search

### Organization
- ✅ Folders/collections system
- ✅ Organize prompts into folders
- ✅ Nested folder support

### Export
- ✅ Export to JSON
- ✅ Export to CSV
- ✅ Export to Markdown

### Templates
- ✅ Template variables (`{{variable}}` syntax)
- ✅ Variable replacement UI
- ✅ Template validation

### Keyboard Shortcuts
- ✅ `Cmd/Ctrl + K` - Focus search
- ✅ `Cmd/Ctrl + N` - New prompt
- ✅ `Cmd/Ctrl + E` - Export
- ✅ `ESC` - Close modals
- ✅ `?` - Show shortcuts help

### Analytics
- ✅ Usage statistics
- ✅ Category breakdown
- ✅ Most used prompts
- ✅ Recent activity

## Troubleshooting

### Supabase Connection Issues
- Verify your URL and anon key are correct
- Check if your Supabase project is active
- Ensure RLS policies are properly set up

### AI Features Not Working
- Verify OpenAI API key is correct
- Check API key has sufficient credits
- AI features are optional - app works without them

### Database Errors
- Ensure all SQL commands ran successfully
- Check Supabase logs in Dashboard > Logs
- Verify RLS policies don't block your operations

## Support

For issues or questions:
- Check the Supabase documentation: https://supabase.com/docs
- Check the OpenAI documentation: https://platform.openai.com/docs

## License

MIT
