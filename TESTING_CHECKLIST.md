# Testing Checklist for Prompt Library

## 🗄️ Database Setup (Do First!)
- [ ] Run `supabase-migrations.sql` in Supabase SQL Editor
- [ ] Verify `folders` table created
- [ ] Verify `folder_id` column added to `prompts` table
- [ ] Check RLS policies are active

## 🔐 Authentication
- [ ] Sign up with new account
- [ ] Log in with existing account
- [ ] Log out successfully
- [ ] Protected routes redirect to login when not authenticated
- [ ] Stay logged in after page refresh

## 📝 Prompt CRUD Operations
- [ ] **Create** a new prompt without AI features
- [ ] **Create** a prompt with AI auto-categorization (if OpenAI key configured)
- [ ] **Create** a prompt with AI auto-tagging
- [ ] **Create** a prompt with quality scoring
- [ ] **Edit** an existing prompt
- [ ] **Delete** a prompt (with confirmation)
- [ ] **Toggle favorite** on/off
- [ ] **Copy** prompt text to clipboard (usage count increments)

## 🗂️ Folders System
- [ ] Create a new folder
- [ ] Edit folder name
- [ ] Edit folder color
- [ ] Delete folder (prompts become unorganized)
- [ ] Assign prompt to folder when creating
- [ ] Move prompt to different folder when editing
- [ ] Filter by "All Prompts"
- [ ] Filter by specific folder
- [ ] Filter by "Unorganized"
- [ ] See correct prompt counts per folder

## 🔍 Search & Filters
- [ ] Search prompts by title
- [ ] Search prompts by content
- [ ] Filter by category
- [ ] Filter by favorites only
- [ ] Sort by: Created (newest)
- [ ] Sort by: Created (oldest)
- [ ] Sort by: Most used
- [ ] Sort by: Title (A-Z)
- [ ] Combine search + filters

## 📤 Export Functionality
- [ ] Export all prompts as JSON
- [ ] Export all prompts as CSV
- [ ] Export all prompts as Markdown
- [ ] Export filtered prompts only
- [ ] Verify file downloads correctly
- [ ] Verify exported data is complete and correct

## ⌨️ Keyboard Shortcuts
- [ ] `Cmd/Ctrl + K` focuses search input
- [ ] `Cmd/Ctrl + N` opens create prompt modal
- [ ] `Cmd/Ctrl + E` toggles export menu
- [ ] `ESC` closes open modals
- [ ] `?` (Shift + /) opens shortcuts help
- [ ] Shortcuts help modal displays correctly

## 📝 Template Variables
- [ ] Create prompt with template variables `{{name}}`, `{{topic}}`
- [ ] Card shows "Fill Template" button instead of "Copy"
- [ ] Click Fill Template opens variable modal
- [ ] Enter values for all variables
- [ ] Live preview updates as you type
- [ ] Copy final text to clipboard
- [ ] Usage count increments after copy

## 📊 Analytics Dashboard
- [ ] Navigate to Analytics page
- [ ] See correct total prompts count
- [ ] See correct favorites count
- [ ] See correct total usage count
- [ ] See correct average usage
- [ ] Category distribution shows all categories
- [ ] Top 5 most used prompts displays correctly
- [ ] Recent activity shows last used prompts

## 🎨 Design Consistency
- [ ] **Landing Page**: Dark theme with floating orbs and gradients
- [ ] **Login Page**: Dark bg, glassmorphism card, gradient logo
- [ ] **Signup Page**: Matches login style
- [ ] **Dashboard**: Dark theme, gradient header, purple buttons
- [ ] **Navbar**: Dark with gradient logo, glassmorphism
- [ ] **Create Modal**: Dark with glassmorphism
- [ ] **Edit Modal**: Matches create modal
- [ ] **Prompt Cards**: Glassmorphism, hover effects, gradient on hover
- [ ] **Folder Sidebar**: Dark with color indicators
- [ ] **Filter Bar**: Dark glassmorphism
- [ ] **Analytics**: Dark with gradient stats
- [ ] **All Buttons**: Gradient primary, outline secondary
- [ ] **All Inputs**: Dark with purple focus rings
- [ ] **All Text**: White/gray with proper contrast

## 🤖 AI Features (Optional - requires OpenAI API key)
- [ ] Auto-categorization suggests correct category
- [ ] Auto-categorization shows confidence score
- [ ] Auto-tagging generates relevant tags (3-7)
- [ ] Quality scoring returns score 0-100
- [ ] Quality scoring provides feedback
- [ ] Embedding generation completes without errors
- [ ] All AI features show loading spinners
- [ ] All AI features show success toasts
- [ ] Features work in both Create and Edit forms
- [ ] Graceful fallback when API key not configured

## 🔄 State Management
- [ ] Data refreshes after create
- [ ] Data refreshes after edit
- [ ] Data refreshes after delete
- [ ] Filters persist during operations
- [ ] Folder selection persists
- [ ] Search query persists
- [ ] Sort order persists

## 📱 Responsive Design
- [ ] Mobile: All pages render correctly
- [ ] Mobile: Navigation works
- [ ] Mobile: Modals are usable
- [ ] Tablet: Layout adapts properly
- [ ] Desktop: Full features accessible

## ⚠️ Error Handling
- [ ] Network errors show toast messages
- [ ] Invalid form data shows validation errors
- [ ] Missing required fields prevented
- [ ] Duplicate folder names handled
- [ ] Empty states display correctly
- [ ] Loading states show spinners

## 🚀 Performance
- [ ] Initial page load < 3 seconds
- [ ] Search is instant
- [ ] Filters apply immediately
- [ ] Modals open/close smoothly
- [ ] No lag when scrolling prompts
- [ ] Animations are smooth (60fps)

## ✅ Final Checks
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All features work without OpenAI key
- [ ] All features work with OpenAI key
- [ ] Design is consistent throughout
- [ ] User experience is smooth
- [ ] Ready for production deployment

---

## 🐛 Known Issues to Watch For
- Ensure Supabase URL has `https://` protocol
- Ensure database migrations are run before testing folders
- OpenAI features require API key in environment variables
- Export only works with prompts in current filter

## 📝 Notes
- Test in Chrome, Firefox, and Safari
- Test on mobile device or use browser DevTools
- Clear browser cache if experiencing issues
- Check Supabase logs for backend errors
