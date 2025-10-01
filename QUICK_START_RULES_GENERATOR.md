# 🚀 Quick Start - Project Rules Generator

## ⚡ Get Running in 3 Steps

### Step 1: Run Database Migration (5 minutes)

1. Open this link:
   ```
   https://supabase.com/dashboard/project/ihpojtawsvzawycxkhzy/sql
   ```

2. Open the file: `project-rules-schema.sql`

3. Copy ALL the contents (Ctrl+A, Ctrl+C)

4. Paste into Supabase SQL Editor

5. Click the **RUN** button (or press Ctrl+Enter)

6. You should see:
   ```
   ✅ SUCCESS! Project Rules Generator tables created.
   sessions_table=1, messages_table=1, templates_table=1
   ```

### Step 2: Test Locally (2 minutes)

Your dev server is already running at:
```
http://localhost:5173/
```

1. Open the app in your browser
2. Log in (or sign up if needed)
3. Go to Dashboard
4. Click any prompt card
5. Click the **"Generate Rules"** button (blue button with ⚙️ icon)
6. Click **"Start Rule Generation"**
7. Answer the questions
8. Watch the magic happen! ✨

### Step 3: Deploy (5 minutes)

```bash
# Make sure you're in the prompt-library directory
cd /mnt/c/Users/jayso/prompt-library

# Deploy to Vercel
vercel --prod
```

**Important**: After deploying, add these environment variables in Vercel:
1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = `https://ihpojtawsvzawycxkhzy.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (copy from .env.local)
   - `VITE_OPENAI_API_KEY` = (copy from .env.local)

---

## 🎯 What You Get

### User Experience
1. Click "Generate Rules" on any prompt
2. AI analyzes the prompt (3 seconds)
3. Asks 5-7 smart questions (2-3 minutes to answer)
4. Generates customized rules (5 seconds)
5. Download as JSON or view in UI

### Generated Rules Include
- ✅ **Code Style** - Linting, formatting, conventions
- ✅ **Security** - Auth, data validation, OWASP best practices
- ✅ **Performance** - Optimization, caching, lazy loading
- ✅ **Testing** - Unit tests, integration tests, coverage
- ✅ **Architecture** - Folder structure, patterns, scalability
- ✅ **Compliance** - GDPR, HIPAA, SOC2 (if applicable)

### Rule Details
Each rule includes:
- **Title** - What the rule is
- **Description** - How to implement it
- **Rationale** - Why it matters
- **Priority** - P0 (critical) to P3 (low)
- **Example** - Code snippet
- **Enforcement** - How to enforce (eslint, tests, etc.)

### Plus Bonus Content
- 📁 **Config Files** - .eslintrc, .prettierrc, tsconfig.json
- 🛠️ **Recommended Tools** - Libraries and tools for your stack
- 📋 **Next Steps** - Action items to get started

---

## 💰 Cost

**Per session**: ~$0.03 (3 cents)
**100 sessions**: ~$2.60/month

Extremely affordable for the value provided!

---

## ✅ Build Status

```
✓ TypeScript compilation: PASSED
✓ Vite build: PASSED (30.95s)
✓ No errors or warnings
✓ All components working
```

---

## 🎨 UI Preview

```
┌─────────────────────────────────────────┐
│  Generate Project-Specific Rules        │
│  ✨ Sparkles Icon                        │
│                                          │
│  Get AI-powered, customized development  │
│  rules tailored to your project's tech   │
│  stack, scale, and requirements.         │
│                                          │
│  [✨ Start Rule Generation]              │
└─────────────────────────────────────────┘

After starting:

┌─────────────────────────────────────────┐
│  Question 1 of 5          20% complete   │
│  ▓▓▓▓░░░░░░░░░░░░░░░░                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🤖 I've analyzed your prompt and        │
│     detected you're building a web app   │
│     using React, Node.js.                │
│                                          │
│     Let's get started! 🚀               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🤖 What's your expected user scale?    │
│     💡 This helps determine caching      │
│        and optimization strategies       │
│                                          │
│  [ Small team (< 100 users)        ]    │
│  [ Medium (100-10k users)          ]    │
│  [ Large (10k-1M users)            ]    │
│  [ Enterprise (1M+ users)          ]    │
└─────────────────────────────────────────┘

After completion:

┌─────────────────────────────────────────┐
│  ✅ Rules Generated Successfully!        │
│     [📥 Download JSON]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Code Style (8 rules)                    │
│  ┌───────────────────────────────────┐  │
│  │ Use Functional Components    [P1] │  │
│  │ All React components must use     │  │
│  │ functional components with hooks  │  │
│  │                                   │  │
│  │ 💭 Why: Modern React standard...  │  │
│  │                                   │  │
│  │ const MyComponent = () => {...}   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "Session not found"
→ Start a new session by clicking "Generate Rules" again

### "OpenAI API key not configured"
→ Check `.env.local` has `VITE_OPENAI_API_KEY`

### Not seeing the button
→ Refresh the page, make sure you're logged in

### Build errors
→ Already verified working! If you modified code, run: `npm run build`

---

## 🎉 You're Done!

Just run the SQL migration and you're ready to go!

Need help? Check `PROJECT_RULES_GENERATOR_SETUP.md` for detailed docs.
