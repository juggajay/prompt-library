# Testing the Project Rules Generator Feature

## Prerequisites

### 1. Database Setup

Run the SQL migration in Supabase:

```bash
# Navigate to your Supabase dashboard
# Go to SQL Editor
# Copy and paste the contents of: supabase/migrations/create_rule_generation_tables.sql
# Click "Run" to execute
```

Or use Supabase CLI:

```bash
supabase db push
```

### 2. Environment Variables

Ensure these are set in `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key

# For Vercel deployment (set in Vercel dashboard):
OPENAI_API_KEY=your_openai_api_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Verify Database Tables

Run this query in Supabase SQL Editor to verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'rule_generation_sessions',
    'rule_conversation_messages',
    'project_rule_templates'
  );
```

You should see all 3 tables listed.

---

## Testing Locally

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Test the UI

1. Navigate to your prompts page (Dashboard)
2. Find any prompt card
3. Click "Generate Rules" button
4. You should see:
   - ✅ "Start Rule Generation" button appears
   - ✅ Purple gradient card with Sparkles icon

### Step 3: Verify API Routes (Manual Test)

Since Vercel serverless functions don't run locally without Vercel CLI, you'll need to either:

**Option A: Use Vercel CLI**

```bash
npm install -g vercel
vercel dev
```

Then visit: `http://localhost:3000`

**Option B: Deploy to Vercel and Test**

```bash
vercel --prod
```

---

## Testing the Complete Flow

### Test Case 1: Basic Flow - Web App Prompt

1. **Create a test prompt:**
   - Title: "E-commerce Website Builder"
   - Content: "Build a React-based e-commerce website with user authentication, shopping cart, and payment processing using Stripe"
   - Category: "Development"

2. **Click "Generate Rules"**

3. **Expected Behavior:**
   - ✅ Loading spinner appears
   - ✅ AI analyzes the prompt (~2-3 seconds)
   - ✅ Detects: `project_type: "web_app"`, `technologies: ["React", "Stripe"]`
   - ✅ Shows initial message with question count

4. **Answer Questions:**
   - Question 1 (Example): "What state management library will you use?"
     - Answer: "Redux Toolkit"
   - Question 2 (Example): "Expected monthly traffic?"
     - Answer: "10,000 users"
   - Continue answering 5-7 questions

5. **Rules Generation:**
   - ✅ Progress bar shows 100%
   - ✅ "Generating rules..." message appears
   - ✅ Rules appear in categorized sections
   - ✅ Download JSON button appears

6. **Verify Generated Rules:**
   - ✅ Rules are organized by category (code_style, security, performance, testing)
   - ✅ Each rule has: title, description, rationale, priority (P0-P3), example
   - ✅ Config files section shows .eslintrc, .prettierrc, tsconfig.json
   - ✅ Recommended tools are listed

7. **Download Rules:**
   - Click "Download JSON"
   - ✅ File downloads as `project-rules.json`
   - ✅ File contains all rules in proper JSON format

---

### Test Case 2: API Project

1. **Create a test prompt:**
   - Title: "REST API for Healthcare System"
   - Content: "Build a secure REST API using Node.js and Express for managing patient records, with HIPAA compliance requirements"

2. **Expected Questions:**
   - Database choice?
   - Authentication method?
   - Expected request volume?
   - Data encryption requirements?
   - HIPAA compliance level?

3. **Expected Rules:**
   - ✅ P0 rules about HIPAA compliance
   - ✅ P0 rules about data encryption
   - ✅ P1 rules about authentication
   - ✅ Security-focused rules
   - ✅ API design patterns

---

### Test Case 3: Multiple Choice Questions

1. Create a prompt that triggers choice-based questions
2. **Expected Behavior:**
   - ✅ Multiple choice buttons appear (not text input)
   - ✅ Clicking a button auto-submits the answer
   - ✅ No need to click "Submit"

---

### Test Case 4: Error Handling

**Test 4a: Missing Environment Variables**

1. Temporarily remove `VITE_OPENAI_API_KEY` from `.env.local`
2. Try to generate rules
3. **Expected:**
   - ✅ Error message appears
   - ✅ "OpenAI API key not configured" or similar error

**Test 4b: Network Failure**

1. Disconnect internet
2. Try to generate rules
3. **Expected:**
   - ✅ Error toast notification
   - ✅ Helpful error message

**Test 4c: Invalid Prompt**

1. Create a prompt with just "test"
2. Try to generate rules
3. **Expected:**
   - ✅ AI still generates questions (may be generic)
   - ✅ No crash

---

## Database Verification

### Check Session Creation

After starting rule generation, run this query:

```sql
SELECT
  id,
  project_type,
  detected_technologies,
  status,
  total_questions,
  current_question_index
FROM rule_generation_sessions
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- ✅ New session appears
- ✅ `status` is "in_progress"
- ✅ `project_type` is detected correctly
- ✅ `total_questions` matches UI

### Check Messages

```sql
SELECT
  session_id,
  role,
  LEFT(content, 50) as content_preview,
  created_at
FROM rule_conversation_messages
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- ✅ Messages alternate between 'assistant' and 'user'
- ✅ First message is from 'assistant'
- ✅ Content matches UI display

### Check Completed Session

After generating rules:

```sql
SELECT
  id,
  status,
  generated_rules->>'rules' as rules_summary,
  rule_categories,
  completed_at
FROM rule_generation_sessions
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;
```

**Expected:**
- ✅ `status` is "completed"
- ✅ `generated_rules` is populated (large JSON object)
- ✅ `rule_categories` array has values
- ✅ `completed_at` is set

---

## Performance Testing

### Response Times

- **Prompt Analysis:** Should complete in 2-5 seconds
- **Each Question Response:** 1-2 seconds
- **Rule Generation:** 5-15 seconds (uses GPT-4o, more complex)

### Cost Tracking

For 1 complete session:
- Prompt analysis: ~1,000 tokens = $0.002
- Question generation: ~1,500 tokens = $0.003
- 5 Q&A rounds: ~3,000 tokens = $0.006
- Rule generation: ~5,000 tokens = $0.015

**Total: ~$0.026 per session**

---

## Common Issues & Solutions

### Issue 1: API Routes Return 404

**Solution:**
- Deploy to Vercel (serverless functions don't work in local Vite)
- OR use `vercel dev` instead of `npm run dev`

### Issue 2: CORS Errors

**Solution:**
- Ensure you're accessing via Vercel domain, not localhost (when deployed)
- Check Vercel logs for actual error

### Issue 3: Database Errors

**Problem:** "relation does not exist"

**Solution:**
```bash
# Run the migration script
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/create_rule_generation_tables.sql
```

### Issue 4: RLS Policy Errors

**Problem:** "new row violates row-level security policy"

**Solution:**
- Ensure user is authenticated
- Check RLS policies in Supabase dashboard
- Verify `user_id` is being passed correctly

### Issue 5: OpenAI Rate Limits

**Problem:** Too many requests

**Solution:**
- Add delay between requests
- Use GPT-4o-mini instead of GPT-4o (cheaper, faster)
- Implement exponential backoff

---

## Deployment Checklist

### Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_OPENAI_API_KEY=sk-... (for client-side features)
```

### Deployment Steps

```bash
# 1. Commit changes
git add .
git commit -m "feat: add project rules generator"

# 2. Push to GitHub
git push origin main

# 3. Deploy to Vercel
vercel --prod

# 4. Verify deployment
# Visit your deployed URL and test the feature
```

---

## Success Criteria

✅ Database tables created successfully
✅ API routes responding (test via Vercel deployment)
✅ UI component renders correctly
✅ Prompt analysis works
✅ Questions are generated and displayed
✅ User can answer questions (text + multiple choice)
✅ Progress bar updates correctly
✅ Rules are generated successfully
✅ Rules are categorized properly
✅ Config files are included
✅ Download JSON works
✅ Session data is saved in database
✅ RLS policies prevent unauthorized access
✅ Error handling works gracefully

---

## Next Steps

After successful testing:

1. **Add Analytics:** Track usage, popular project types, rule effectiveness
2. **Template Library:** Save successful rule sets for reuse
3. **Team Sharing:** Share rules across organization
4. **CI/CD Integration:** Export rules to .github/workflows
5. **Rule Customization:** Allow editing rules before download
6. **A/B Testing:** Compare different rule generation strategies

---

## Support

If you encounter issues:

1. Check Vercel logs: `vercel logs`
2. Check Supabase logs in dashboard
3. Check browser console for client-side errors
4. Verify all environment variables are set
5. Test API routes individually using Postman/Insomnia

Good luck! 🚀
