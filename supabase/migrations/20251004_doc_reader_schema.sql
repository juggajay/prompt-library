-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Guides table
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT DEFAULT 'Untitled',
  source_url TEXT NOT NULL,
  source_hash TEXT,
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  ai_model TEXT NOT NULL DEFAULT 'gpt-4o',
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT true,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'queued', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_status ON guides(processing_status);
CREATE INDEX IF NOT EXISTS idx_guides_source_url ON guides(source_url);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides(created_at DESC);

-- Guide content with full-text search
CREATE TABLE IF NOT EXISTS guide_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE NOT NULL UNIQUE,
  raw_content TEXT,
  processed_content TEXT NOT NULL,
  sections JSONB,
  metadata JSONB,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(processed_content, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_content_search ON guide_content USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_guide_content_guide_id ON guide_content(guide_id);

-- Chunks with embeddings for RAG
CREATE TABLE IF NOT EXISTS guide_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  section_title TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, chunk_index)
);

-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON guide_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_guide_id ON guide_chunks(guide_id);

-- Categories for organization
CREATE TABLE IF NOT EXISTS doc_reader_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES doc_reader_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_reader_categories_user_id ON doc_reader_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_reader_categories_parent_id ON doc_reader_categories(parent_id);

-- Tags
CREATE TABLE IF NOT EXISTS doc_reader_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_doc_reader_tags_user_id ON doc_reader_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_reader_tags_slug ON doc_reader_tags(slug);

-- Guide tags junction table
CREATE TABLE IF NOT EXISTS guide_tags (
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES doc_reader_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (guide_id, tag_id)
);

-- Guide categories junction table
CREATE TABLE IF NOT EXISTS guide_categories (
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  category_id UUID REFERENCES doc_reader_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (guide_id, category_id)
);

-- Conversations for chat
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guide_id ON conversations(guide_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Cached content to avoid re-scraping
CREATE TABLE IF NOT EXISTS cached_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  url_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT,
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cached_content_url_hash ON cached_content(url_hash);
CREATE INDEX IF NOT EXISTS idx_cached_content_expires_at ON cached_content(expires_at);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  cost DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_id_date ON api_usage(user_id, date DESC);

-- Function to match guide chunks using vector similarity
CREATE OR REPLACE FUNCTION match_guide_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  filter_guide_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  guide_id uuid,
  content text,
  section_title text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    guide_chunks.id,
    guide_chunks.guide_id,
    guide_chunks.content,
    guide_chunks.section_title,
    1 - (guide_chunks.embedding <=> query_embedding) as similarity
  FROM guide_chunks
  WHERE
    (filter_guide_id IS NULL OR guide_chunks.guide_id = filter_guide_id)
    AND 1 - (guide_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY guide_chunks.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_guides_updated_at ON guides;
CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_usage_updated_at ON api_usage;
CREATE TRIGGER update_api_usage_updated_at BEFORE UPDATE ON api_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_reader_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_reader_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guides
DROP POLICY IF EXISTS "Users can view their own guides" ON guides;
CREATE POLICY "Users can view their own guides"
  ON guides FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own guides" ON guides;
CREATE POLICY "Users can insert their own guides"
  ON guides FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own guides" ON guides;
CREATE POLICY "Users can update their own guides"
  ON guides FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own guides" ON guides;
CREATE POLICY "Users can delete their own guides"
  ON guides FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for guide_content
DROP POLICY IF EXISTS "Users can view content of their guides" ON guide_content;
CREATE POLICY "Users can view content of their guides"
  ON guide_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guides
      WHERE guides.id = guide_content.guide_id
      AND guides.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert content for their guides" ON guide_content;
CREATE POLICY "Users can insert content for their guides"
  ON guide_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guides
      WHERE guides.id = guide_content.guide_id
      AND guides.user_id = auth.uid()
    )
  );

-- RLS Policies for guide_chunks
DROP POLICY IF EXISTS "Users can view chunks of their guides" ON guide_chunks;
CREATE POLICY "Users can view chunks of their guides"
  ON guide_chunks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guides
      WHERE guides.id = guide_chunks.guide_id
      AND guides.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert chunks for their guides" ON guide_chunks;
CREATE POLICY "Users can insert chunks for their guides"
  ON guide_chunks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guides
      WHERE guides.id = guide_chunks.guide_id
      AND guides.user_id = auth.uid()
    )
  );

-- RLS Policies for categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON doc_reader_categories;
CREATE POLICY "Users can manage their own categories"
  ON doc_reader_categories FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for tags
DROP POLICY IF EXISTS "Users can view global and their own tags" ON doc_reader_tags;
CREATE POLICY "Users can view global and their own tags"
  ON doc_reader_tags FOR SELECT
  TO authenticated
  USING (is_global = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own tags" ON doc_reader_tags;
CREATE POLICY "Users can insert their own tags"
  ON doc_reader_tags FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;
CREATE POLICY "Users can manage their own conversations"
  ON conversations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- RLS Policies for api_usage
DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage;
CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage api_usage" ON api_usage;
CREATE POLICY "Service role can manage api_usage"
  ON api_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
