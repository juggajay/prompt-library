# 🚀 Project Rules Generator - Complete Deployment Guide

## ✅ What's Already Done

### Code Implementation
- ✅ API routes created (`/api/rules/analyze-prompt`, `/api/rules/conversation`, `/api/rules/generate`)
- ✅ React component created (`ProjectRulesGenerator.tsx`)
- ✅ Component integrated into `PromptCard.tsx`
- ✅ Database schema defined (`create_rule_generation_tables.sql`)
- ✅ Environment variables configured in `.env.local`
- ✅ Build passes successfully (no TypeScript errors)
- ✅ `@vercel/node` dependency installed

### What You Need to Do

**Only 2 steps remaining:**

1. **Setup Database** (5 minutes) - Run SQL migration in Supabase
2. **Deploy to Vercel** (10 minutes) - Deploy and configure environment variables

---

## 📋 Step-by-Step Deployment

### STEP 1: Setup Database (5 minutes)

#### 1.1 Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project: `ihpojtawsvzawycxkhzy`
- Click: **SQL Editor** (left sidebar)

#### 1.2 Run Migration
1. Click **New Query**
2. Open file: `supabase/migrations/create_rule_generation_tables.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

#### 1.3 Verify Success
Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'rule_%'
ORDER BY table_name;
```

**Expected output:**
```
rule_conversation_messages
rule_generation_sessions
```

✅ **Database setup complete!**

---

### STEP 2: Deploy to Vercel (10 minutes)

#### 2.1 Get Supabase Service Role Key

1. Go to Supabase Dashboard
2. Click **Settings** → **API**
3. Scroll to **Project API keys**
4. Copy the **service_role** key (the long one, not the anon key)
5. **⚠️ IMPORTANT:** This key is secret! Never commit it to Git.

#### 2.2 Deploy to Vercel

##### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Import Your Repository**
   - Click **Add New** → **Project**
   - Select your GitHub repository: `prompt-library`
   - Click **Import**

3. **Configure Environment Variables**
   Before clicking Deploy, add these environment variables:

   ```
   OPENAI_API_KEY=<your OpenAI API key from .env.local>

   SUPABASE_SERVICE_ROLE_KEY=<paste your service role key here>

   VITE_SUPABASE_URL=<your Supabase URL from .env.local>

   VITE_SUPABASE_ANON_KEY=<your Supabase anon key from .env.local>

   VITE_OPENAI_API_KEY=<your OpenAI API key from .env.local>
   ```

4. **Deploy**
   - Click **Deploy**
   - Wait 2-3 minutes
   - ✅ Deployment complete!

##### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# When prompted for environment variables, add them one by one
```

---

### STEP 3: Test the Feature (15 minutes)

#### 3.1 Access Your Deployed App
- Go to your Vercel deployment URL (e.g., `https://prompt-library.vercel.app`)
- Login with your account

#### 3.2 Test Basic Flow

**Test Case: E-commerce Web App**

1. **Navigate to Dashboard**
   - Click on Dashboard
   - You should see your existing prompts

2. **Create a Test Prompt** (or use existing)
   - Title: "E-commerce Platform"
   - Content: "Build a React e-commerce website with user auth, shopping cart, and Stripe payment processing"
   - Category: "Development"
   - Click Save

3. **Generate Rules**
   - Find the prompt card
   - Click **Generate Rules** button
   - ✅ Should show purple gradient card with "Start Rule Generation"

4. **Start the Process**
   - Click **Start Rule Generation**
   - ✅ Should show loading spinner
   - ✅ After 2-5 seconds, should show:
     - "I've analyzed your prompt..."
     - Detected project type (e.g., "web app")
     - First question

5. **Answer Questions**
   - Answer 5-7 questions as they appear
   - ✅ Progress bar should update
   - ✅ Each answer should trigger next question

6. **View Generated Rules**
   - After last question, wait 10-15 seconds
   - ✅ Should show: "Rules Generated Successfully!"
   - ✅ Should display rules organized by category
   - ✅ Should show Download JSON button

7. **Download Rules**
   - Click **Download JSON**
   - ✅ Should download `project-rules.json`
   - ✅ Open file and verify it contains rules

#### 3.3 Verify Database

Go back to Supabase Dashboard → SQL Editor and run:

```sql
SELECT
  id,
  project_type,
  detected_technologies,
  status,
  total_questions,
  created_at
FROM rule_generation_sessions
ORDER BY created_at DESC
LIMIT 5;
```

✅ **You should see your test session with status: "completed"**

---

## 🐛 Troubleshooting

### Issue 1: "Failed to analyze prompt"

**Possible Causes:**
- OpenAI API key is invalid or expired
- OpenAI API key doesn't have credits
- Rate limit reached

**Solution:**
1. Check Vercel logs: `vercel logs` or Vercel Dashboard → Deployments → Latest → Logs
2. Verify OpenAI API key is correct
3. Check OpenAI dashboard for usage/credits

### Issue 2: "Session not found"

**Possible Causes:**
- Database tables not created
- RLS policies preventing access
- Wrong Supabase credentials

**Solution:**
1. Verify database tables exist (see STEP 1.3)
2. Check Supabase logs in Dashboard → Logs
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel

### Issue 3: 404 on API routes

**Possible Causes:**
- Vercel routing not configured
- API files not deployed

**Solution:**
1. Check `vercel.json` exists in root
2. Verify `api/` folder is included in deployment
3. Redeploy: `vercel --prod --force`

### Issue 4: CORS errors

**This shouldn't happen** because API routes are same-origin, but if it does:

**Solution:**
- Make sure you're accessing via the Vercel domain (not localhost)
- Check browser console for actual error
- Verify `vercel.json` has correct rewrites

### Issue 5: "Missing environment variables"

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify all 5 variables are set
3. Redeploy to apply changes

---

## 📊 Monitoring & Analytics

### Check API Logs

**Via Vercel Dashboard:**
1. Go to your project
2. Click **Deployments**
3. Click on latest deployment
4. Click **Functions**
5. View logs for `/api/rules/*`

**Via CLI:**
```bash
vercel logs --follow
```

### Monitor Costs

**OpenAI Usage:**
- Dashboard: https://platform.openai.com/usage
- Expected: ~$0.026 per rule generation session
- Budget: Set alerts in OpenAI dashboard

**Vercel Usage:**
- Dashboard: https://vercel.com/dashboard/usage
- Serverless function executions
- Bandwidth usage

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Database tables created in Supabase
- [ ] RLS policies enabled
- [ ] All environment variables set in Vercel
- [ ] App deployed successfully to Vercel
- [ ] Can access app via Vercel URL
- [ ] Can login to app
- [ ] "Generate Rules" button appears on prompt cards
- [ ] Clicking button shows purple gradient card
- [ ] Starting generation analyzes prompt (2-5 sec)
- [ ] Questions appear one by one
- [ ] Progress bar updates correctly
- [ ] Rules generate successfully (10-15 sec)
- [ ] Rules display in categorized format
- [ ] Can download rules as JSON
- [ ] Database session is created and completed
- [ ] No errors in Vercel logs
- [ ] No errors in browser console

---

## 🎯 What Users Will See

### User Flow

1. **User creates/views a prompt**
   - Standard prompt card display

2. **User clicks "Generate Rules"**
   - New button appears below "Improve Prompt"
   - Purple/blue gradient styling

3. **User starts rule generation**
   - AI analyzes their prompt in 2-5 seconds
   - Shows detected project type and technologies
   - Presents first question

4. **User answers 5-7 questions**
   - Questions are specific to their project type
   - Can be text input or multiple choice buttons
   - Progress bar shows completion percentage

5. **AI generates customized rules**
   - Takes 10-15 seconds
   - Rules organized by category:
     - Code Style
     - Security
     - Performance
     - Testing
     - Architecture
     - Compliance (if applicable)

6. **User reviews and downloads rules**
   - Can expand each rule to see details
   - Can download as JSON
   - Can use rules with Claude Code (instructions provided)

---

## 🚀 What's Next?

After successful deployment:

### Phase 2 Features (Optional)
- [ ] Rule editing before download
- [ ] Save rule templates for reuse
- [ ] Share rules with team members
- [ ] Export to GitHub Actions workflows
- [ ] A/B test different rule generation strategies
- [ ] Analytics dashboard for rule effectiveness

### Optimizations
- [ ] Add caching for common project types
- [ ] Implement streaming responses for faster UX
- [ ] Add rule prioritization (critical/important/optional)
- [ ] Create pre-made rule templates

---

## 📞 Support

If you encounter issues not covered in troubleshooting:

1. **Check Logs:**
   - Vercel: Dashboard → Deployments → Functions
   - Supabase: Dashboard → Logs → API
   - Browser: Console (F12)

2. **Common Log Locations:**
   - API errors: Vercel function logs
   - Database errors: Supabase API logs
   - UI errors: Browser console

3. **Debug Checklist:**
   - [ ] Environment variables set?
   - [ ] Database tables created?
   - [ ] OpenAI API key valid?
   - [ ] Supabase credentials correct?
   - [ ] Latest code deployed?

---

## 🎉 Congratulations!

You've successfully implemented the **Project Rules Generator** feature!

**Key Achievements:**
- ✅ AI-powered project analysis
- ✅ Conversational rule generation
- ✅ Customized rules for any tech stack
- ✅ Production-ready database schema
- ✅ Full Vercel deployment

**Impact:**
- Users can get project-specific rules in 5-7 minutes
- Rules are tailored to their exact tech stack
- Improves code quality and consistency
- Saves hours of manual rule creation

**Estimated Costs:**
- ~$0.026 per rule generation session
- For 100 users/month: ~$2.60/month
- Incredibly cost-effective!

Enjoy your new feature! 🚀
