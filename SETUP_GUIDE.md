# Quick Setup Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (~2 minutes)
3. Go to SQL Editor and run the entire `supabase-schema.sql` file
4. Go to Settings → API and copy:
   - Project URL
   - anon public key

### Step 3: Configure Environment

1. Copy the example env file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_OPENAI_API_KEY=optional-for-ai-features
```

### Step 4: Run the App
```bash
npm run dev
```

Visit `http://localhost:5173` and create an account!

## 📦 What You Get

✅ Full authentication system
✅ Create, read, update, delete prompts
✅ Search and filter functionality
✅ Categories and tags
✅ Favorites system
✅ Usage tracking
✅ Copy to clipboard
✅ Responsive design

## 🚢 Deploy to Vercel

### Option 1: GitHub (Recommended)
1. Push to GitHub: `git remote add origin <your-repo-url> && git push -u origin master`
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repository
4. Add environment variables (same as .env.local)
5. Deploy!

### Option 2: Vercel CLI
```bash
npm i -g vercel
vercel
```

## 🔧 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has the correct variables
- Restart the dev server after changing env variables

### "Auth session missing"
- Check that the database schema was run successfully
- Verify Supabase URL and key are correct
- Try signing out and back in

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 Next Steps

1. **Create your first prompt** - Click "New Prompt" button
2. **Organize with categories** - Choose from 7 predefined categories
3. **Add tags** - Make prompts searchable
4. **Mark favorites** - Star your most-used prompts
5. **Use search** - Find prompts instantly

## 🤖 Enable AI Features (Optional)

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local`:
```env
VITE_OPENAI_API_KEY=sk-your-key-here
```
3. When deploying to Vercel, add `OPENAI_API_KEY` (no VITE_ prefix) as an environment variable

**Note**: AI features are optional and will incur OpenAI API costs.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)

## 🆘 Need Help?

- Check the full README.md for detailed documentation
- Review the supabase-schema.sql to understand the database structure
- Look at example components in src/components/

---

**You're all set!** 🎉 Start building your prompt library!
