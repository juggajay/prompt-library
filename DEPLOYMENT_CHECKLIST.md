# Deployment Checklist

Use this checklist to deploy your Prompt Library application.

## ☐ Pre-Deployment Setup

### 1. Supabase Setup
- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Wait for database to initialize (~2 min)
- [ ] Go to SQL Editor
- [ ] Copy entire contents of `supabase-schema.sql`
- [ ] Run the SQL script
- [ ] Verify tables created: Check "Table Editor" for `profiles` and `prompts` tables
- [ ] Go to Settings → API
- [ ] Copy Project URL
- [ ] Copy `anon` public key

### 2. OpenAI Setup (Optional - for AI features)
- [ ] Create account at [platform.openai.com](https://platform.openai.com)
- [ ] Add payment method
- [ ] Generate API key
- [ ] Copy and save API key securely

### 3. Local Testing
- [ ] Update `.env.local` with your credentials:
  ```env
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  VITE_OPENAI_API_KEY=your_openai_key (optional)
  ```
- [ ] Run `npm install` (if not already done)
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Create a test prompt
- [ ] Test search functionality
- [ ] Test filters
- [ ] Test favorites
- [ ] Test copy to clipboard
- [ ] Test delete prompt
- [ ] Test logout

## ☐ GitHub Setup

### Push to GitHub
- [ ] Create new repository on GitHub
- [ ] Copy the repository URL
- [ ] Run: `git remote add origin <your-repo-url>`
- [ ] Run: `git push -u origin master`
- [ ] Verify code is on GitHub

## ☐ Vercel Deployment

### Deploy via Vercel Website
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Configure project:
  - Framework Preset: Vite
  - Root Directory: ./
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] Add Environment Variables:
  - `VITE_SUPABASE_URL` = your_supabase_url
  - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key
  - `OPENAI_API_KEY` = your_openai_key (optional, NO VITE_ prefix)
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete (~2 min)
- [ ] Visit your deployment URL

### Post-Deployment Testing
- [ ] Open deployed URL
- [ ] Test signup with new email
- [ ] Check email for verification (if enabled)
- [ ] Login to application
- [ ] Create a prompt
- [ ] Test all features work in production:
  - [ ] Create prompt
  - [ ] Search prompts
  - [ ] Filter by category
  - [ ] Toggle favorites
  - [ ] Copy to clipboard
  - [ ] Delete prompt
  - [ ] Logout
  - [ ] Login again
- [ ] Test on mobile device
- [ ] Test on tablet
- [ ] Test on different browsers

## ☐ Supabase Configuration (Optional)

### Email Settings
- [ ] Go to Supabase → Authentication → Email Templates
- [ ] Customize confirmation email (optional)
- [ ] Customize reset password email (optional)
- [ ] Update site URL to your Vercel domain

### Security
- [ ] Review RLS policies in Supabase
- [ ] Test that users can only see their own prompts
- [ ] Verify no unauthorized access

## ☐ Post-Deployment

### Documentation
- [ ] Update README.md with your deployed URL
- [ ] Add screenshots (optional)
- [ ] Update repository description

### Monitoring
- [ ] Check Vercel Analytics (if enabled)
- [ ] Monitor Supabase usage in dashboard
- [ ] Check for any error logs in Vercel

### Share with Team
- [ ] Share deployed URL with team members
- [ ] Each team member creates account
- [ ] Gather feedback
- [ ] Create issues for bugs (if any)

## ☐ Optional Enhancements

### Custom Domain
- [ ] Purchase domain (optional)
- [ ] Add domain in Vercel settings
- [ ] Update DNS records
- [ ] Wait for DNS propagation
- [ ] Update Supabase site URL

### Advanced Features
- [ ] Enable AI features (if not done)
- [ ] Add analytics (Vercel Analytics)
- [ ] Setup error tracking (Sentry)
- [ ] Add more custom categories
- [ ] Implement edit prompt feature
- [ ] Add dark mode

## 🆘 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all variables start with `VITE_` for client-side
- Check build logs in Vercel dashboard

### Can't Login
- Verify Supabase URL and key
- Check Supabase auth settings
- Clear browser cache
- Check email verification settings

### Database Errors
- Verify schema was run successfully
- Check RLS policies are enabled
- Test queries in Supabase SQL editor

### API Routes Not Working
- Verify `OPENAI_API_KEY` is set (no VITE_ prefix)
- Check Vercel function logs
- Verify API route files are in `/api` directory

## ✅ Success Criteria

Your deployment is successful when:
- ✅ Application loads without errors
- ✅ Users can sign up and login
- ✅ Prompts can be created, read, updated, deleted
- ✅ Search and filters work
- ✅ Data persists across sessions
- ✅ Works on mobile and desktop
- ✅ No console errors
- ✅ All team members can access

## 📊 Cost Tracking

Monitor your costs:
- **Supabase**: Check dashboard for usage
- **Vercel**: Free tier covers most projects
- **OpenAI**: Check usage at platform.openai.com

Set up billing alerts to avoid surprises!

## 🎉 You're Live!

Once all items are checked:
1. Celebrate! 🎊
2. Start using your prompt library
3. Gather feedback from team
4. Plan V2 features
5. Keep building!

---

Need help? Check README.md or SETUP_GUIDE.md
