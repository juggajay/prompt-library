# 🚀 Quick Start - Project Rules Generator

## ⚡ Deploy in 30 Minutes

### ✅ What's Already Done

Everything is implemented and ready! You just need to:
1. Setup database (5 min)
2. Deploy to Vercel (10 min)
3. Test it works (15 min)

---

## 📋 Deployment Checklist

### STEP 1: Database Setup (5 minutes)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   → Select project: ihpojtawsvzawycxkhzy
   → Click "SQL Editor"
   → Click "New Query"
   ```

2. **Run Migration**
   ```
   → Open file: supabase/migrations/create_rule_generation_tables.sql
   → Copy entire contents
   → Paste into SQL Editor
   → Click "Run"
   ```

3. **Verify Success**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name LIKE 'rule_%';
   ```

   Should return:
   - `rule_conversation_messages`
   - `rule_generation_sessions`

✅ **Done!**

---

### STEP 2: Get Service Role Key (2 minutes)

1. **In Supabase Dashboard**
   ```
   → Click "Settings" → "API"
   → Scroll to "Project API keys"
   → Copy the "service_role" key (the long one)
   ```

2. **Save it for next step** (don't commit to git!)

---

### STEP 3: Deploy to Vercel (10 minutes)

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   → Click "Add New" → "Project"
   → Import your repository: "prompt-library"
   ```

2. **Add Environment Variables**

   Before clicking Deploy, add these 5 variables:

   | Name | Value |
   |------|-------|
   | `OPENAI_API_KEY` | *Copy from `.env.local`* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *paste from STEP 2* |
   | `VITE_SUPABASE_URL` | *Copy from `.env.local`* |
   | `VITE_SUPABASE_ANON_KEY` | *Copy from `.env.local`* |
   | `VITE_OPENAI_API_KEY` | *Copy from `.env.local`* |

3. **Deploy**
   ```
   → Click "Deploy"
   → Wait 2-3 minutes
   → Copy your deployment URL
   ```

✅ **Live!**

---

### STEP 4: Test It Works (15 minutes)

1. **Open Your Deployed App**
   ```
   → Go to your Vercel URL
   → Login to your account
   ```

2. **Create Test Prompt**
   ```
   Title: "E-commerce Platform"
   Content: "Build a React e-commerce site with user auth, cart, and Stripe payments"
   Category: "Development"
   → Click Save
   ```

3. **Generate Rules**
   ```
   → Find the prompt card
   → Click "Generate Rules" button
   → Click "Start Rule Generation"
   ```

4. **Expected Flow**
   ```
   ✅ Loading for 2-5 seconds
   ✅ Shows: "I've analyzed your prompt... web app"
   ✅ Shows first question
   ✅ Answer 5-7 questions
   ✅ Progress bar updates (0% → 100%)
   ✅ Shows: "Generating rules..."
   ✅ Displays categorized rules
   ✅ "Download JSON" button appears
   ```

5. **Download & Verify**
   ```
   → Click "Download JSON"
   → Open project-rules.json
   → Should contain rules organized by category
   ```

✅ **Working!**

---

## 🐛 Quick Troubleshooting

### "Failed to analyze prompt"
→ Check OpenAI API key has credits
→ Check Vercel logs for details

### "Session not found"
→ Verify database tables exist (STEP 1.3)
→ Check SUPABASE_SERVICE_ROLE_KEY is set

### 404 on API routes
→ Verify `api/` folder is deployed
→ Check `vercel.json` exists
→ Redeploy with `vercel --prod --force`

### CORS errors
→ Make sure using Vercel URL (not localhost)
→ Check browser console for actual error

---

## 📊 Verify Database

After testing, check Supabase:

```sql
SELECT
  project_type,
  status,
  total_questions,
  created_at
FROM rule_generation_sessions
ORDER BY created_at DESC
LIMIT 5;
```

Should show your test session with `status = 'completed'`

---

## ✅ Success!

If all steps passed:
- ✅ Database is setup
- ✅ App is deployed
- ✅ Feature works end-to-end
- ✅ Users can generate rules

**You're done!** 🎉

---

## 📚 Full Documentation

For detailed information, see:

- **DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **test-rules-feature.md** - Comprehensive testing
- **FEATURE_SUMMARY.md** - Feature overview
- **SETUP_DATABASE.md** - Database details

---

## 💰 Cost

**Per rule generation:** ~$0.026 (less than 3 cents)

**Monthly estimates:**
- 10 users: $0.26/month
- 100 users: $2.60/month
- 1000 users: $26/month

**Extremely cost-effective!**

---

## 🎯 What Users Get

- 🤖 AI analyzes their prompt
- 💬 Answers 5-7 smart questions
- 📋 Gets 20+ customized rules
- ⚡ Takes 5-7 minutes total
- 📥 Downloads as JSON
- 🚀 Can apply with Claude Code

**Saves 2-4 hours per project!**

---

## 🚀 Go Live!

Start with **STEP 1** above and you'll be live in 30 minutes!

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

Good luck! 🎉
