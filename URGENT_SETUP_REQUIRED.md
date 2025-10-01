# 🚨 URGENT: Database Migrations Required

## Current Issues

Your app is experiencing these errors:
1. ❌ Folders table not found (404 errors)
2. ❌ Improvement fields missing on prompts table (400 errors)
3. ⚠️ OpenAI key warning (expected, can ignore)

## Quick Fix (5 Minutes)

### Step 1: Run Database Migrations

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Select your project: `ihpojtawsvzawycxkhzy`

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Paste This File:**
   - Open: `/COMPLETE_MIGRATIONS.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success:**
   - You should see multiple "success" messages
   - Check the verification queries at the bottom
   - Should show tables were created

### Step 2: Refresh Your App

After running migrations:
1. Refresh your browser tab
2. Errors should be gone
3. Try clicking "Improve with AI" button

---

## What Gets Created

The migration creates:

### 1. Folders System ✅
```sql
CREATE TABLE folders (
  id, user_id, name, color, description,
  parent_folder_id, created_at, updated_at
)
```

### 2. Improvements Tracking ✅
```sql
ALTER TABLE prompts ADD COLUMN:
  - was_improved (boolean)
  - original_version (text)
  - improvement_history (jsonb)
  - folder_id (uuid)
```

### 3. Improvements Cache ✅
```sql
CREATE TABLE prompt_improvements (
  original_prompt, improved_prompt,
  changes_made, reasoning,
  clarity_score, specificity_score,
  structure_score, overall_score,
  usage_count, cost tracking...
)
```

---

## Error Explanations

### "Cannot read properties of undefined (reading 'toLowerCase')"

**Cause:** Missing folder_id field in prompts table
**Fix:** Run migrations to add folder_id column

### "Failed to load resource: 404 (folders table)"

**Cause:** Folders table doesn't exist yet
**Fix:** Run migrations to create folders table

### "Failed to save improved prompt: 400"

**Cause:** Missing was_improved, original_version, improvement_history columns
**Fix:** Run migrations to add these columns

### "OpenAI API key not found"

**Cause:** This is EXPECTED for client-side - the key is in .env.local
**Fix:** No action needed - API route has the key
**Note:** The warning is normal, AI features work via API route

---

## After Migration Checklist

- [ ] Folders table exists (check Supabase Table Editor)
- [ ] Prompts table has new columns (was_improved, original_version, improvement_history, folder_id)
- [ ] Prompt_improvements table exists
- [ ] No more 404 errors in browser console
- [ ] No more 400 errors on prompt updates
- [ ] "Improve with AI" button works

---

## If Migrations Fail

### Error: "relation already exists"
**Meaning:** Tables were partially created before
**Solution:** The migration uses `CREATE TABLE IF NOT EXISTS` and `DROP POLICY IF EXISTS`, so it's safe to re-run

### Error: "column already exists"
**Meaning:** Some columns were added before
**Solution:** Migration checks for existing columns with `IF NOT EXISTS`, safe to re-run

### Error: "permission denied"
**Meaning:** Not using service role
**Solution:** Make sure you're logged into Supabase dashboard as project owner

---

## Testing After Migration

### Test 1: Folders Work
1. Go to Dashboard
2. Look for folder sidebar on left
3. Try creating a new folder
4. Should work without 404 errors

### Test 2: Prompt Improvement Works
1. Go to any prompt card
2. Click "Improve with AI"
3. Should see loading state
4. Should show improvement results
5. Click "Use Improved Version"
6. Should save without 400 error

### Test 3: Create Form Improvement
1. Click "New Prompt"
2. Enter title and prompt text
3. Look for "Improve this prompt before saving"
4. Click and test improvement flow
5. Should work end-to-end

---

## Still Having Issues?

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for error messages
4. Common issues:
   - RLS policies blocking access
   - Missing auth.users table
   - Column type mismatches

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - Network errors (red)
   - API responses (400/404)
   - JavaScript errors

### Verify Environment
1. Check `.env.local` has:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY`
2. Restart dev server after changes

---

## Contact Info

If migrations still fail:
1. Check Supabase project dashboard
2. Verify you have project owner access
3. Check that project isn't paused
4. Ensure project has credits/active subscription

---

**Timeline:** 5 minutes to run migrations
**Priority:** HIGH - App won't work without these
**Status:** Ready to run

Run `/COMPLETE_MIGRATIONS.sql` now! 🚀
