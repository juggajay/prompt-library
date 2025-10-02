# Database Setup for Project Rules Generator

## Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **ihpojtawsvzawycxkhzy**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration

Copy the entire contents of this file:
```
supabase/migrations/create_rule_generation_tables.sql
```

Paste it into the SQL Editor and click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Created

Run this verification query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'rule_generation_sessions',
    'rule_conversation_messages',
    'project_rule_templates'
  )
ORDER BY table_name;
```

**Expected Output:**
```
table_name
──────────────────────────────
project_rule_templates
rule_conversation_messages
rule_generation_sessions
```

### Step 4: Verify RLS Policies

Run this query to check Row Level Security policies:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'rule_generation_sessions',
  'rule_conversation_messages',
  'project_rule_templates'
)
ORDER BY tablename, policyname;
```

**Expected Output:**
You should see policies like:
- `Users can manage their own rule sessions`
- `Users can manage messages in their sessions`
- `Users can view public templates and manage their own`
- `Users can create their own templates`

---

## Troubleshooting

### Issue: "relation already exists"

**This is fine!** It means the tables are already created. You can skip to verification.

### Issue: "permission denied"

**Solution:**
1. Make sure you're logged into Supabase
2. Make sure you're in the correct project
3. Try running the query again

### Issue: "syntax error"

**Solution:**
1. Make sure you copied the ENTIRE SQL file
2. Check that no characters were corrupted during copy/paste
3. Try copying again from the source file

---

## Manual Verification

If the queries above don't work, you can verify manually:

1. Click **Database** in the left sidebar
2. Click **Tables**
3. Look for these tables:
   - `rule_generation_sessions`
   - `rule_conversation_messages`
   - `project_rule_templates`

4. Click **Policies** to verify RLS is enabled

---

## Alternative: Supabase CLI

If you prefer command-line:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref ihpojtawsvzawycxkhzy

# Run migration
supabase db push
```

---

## What These Tables Do

### `rule_generation_sessions`
Stores each conversation session when a user generates rules. Tracks:
- Which prompt it's for
- Project type detected (web_app, mobile_app, etc.)
- Technologies detected (React, Node.js, etc.)
- Questions asked and user responses
- Generated rules (as JSON)
- Status (in_progress, completed, abandoned)

### `rule_conversation_messages`
Stores individual messages in the conversation:
- Assistant messages (questions)
- User messages (answers)
- Timestamps
- Related question data

### `project_rule_templates`
Stores reusable rule templates:
- Pre-made rule sets for common project types
- Can be public (shared) or private
- Tracks usage and success rate

---

## Next Steps

After database setup is complete:

✅ Database tables created
✅ RLS policies enabled
✅ Ready to test the feature!

Continue to: `test-rules-feature.md`
