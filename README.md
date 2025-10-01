# 🚀 Prompt Library - AI-Powered Prompt Management

A beautiful, feature-rich application for organizing and managing your AI prompts with intelligent features and modern design.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-blue)

## ✨ Complete Feature Set

### 🤖 AI-Powered Features
- **Auto-Categorization**: GPT-4o-mini analyzes and suggests categories with confidence scores
- **Auto-Tagging**: Intelligent tag generation (3-7 tags) from content analysis
- **Quality Scoring**: 0-100 rating with detailed feedback and improvement suggestions
- **Embedding Generation**: Vector embeddings for future semantic search

### 📁 Organization & Management
- **Folders System**: Color-coded folders (6 presets) with nesting support
- **Categories & Tags**: Flexible organization with custom categories and tags
- **Favorites**: Star important prompts for quick access
- **Search & Filter**: Full-text search with multiple filter combinations
- **Sort Options**: By date, usage, title, favorites

### ⚡ Productivity Features
- **Keyboard Shortcuts**: 5 shortcuts for power users (Cmd/Ctrl + K, N, E, ESC, ?)
- **Template Variables**: Support for `{{placeholder}}` syntax with live preview
- **One-Click Copy**: Clipboard integration with automatic usage tracking
- **Edit Functionality**: Full inline editing with all AI features
- **Export**: Download prompts as JSON, CSV, or Markdown

### 📊 Analytics Dashboard
- Usage statistics and trends
- Category distribution with visual breakdown
- Top 5 most used prompts ranking
- Recent activity timeline with dates
- Real-time metrics

### 🎨 Beautiful Design
- Modern dark theme with purple/fuchsia gradients
- Glassmorphism effects throughout
- Floating animated orbs
- Smooth transitions and hover effects
- Fully responsive (mobile, tablet, desktop)

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** + **Zod** for form validation
- **TanStack Query** (React Query) for data fetching
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend & Database
- **Supabase** for backend and database
- **PostgreSQL** with full-text search
- **Row Level Security (RLS)** for data protection

### AI Integration (Optional)
- **OpenAI** for embeddings and auto-categorization
- Semantic search with vector similarity

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Supabase account (free tier is fine)
- An OpenAI API key (optional, for AI features)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd prompt-library
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the entire `supabase-schema.sql` file
3. This will create all necessary tables, policies, and functions
4. Get your project URL and anon key from Settings → API

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key_optional
```

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment to Vercel

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (for AI features, no VITE_ prefix)
5. Deploy!

### 3. Deploy via CLI

```bash
vercel
```

Follow the prompts and add environment variables when asked.

## Project Structure

```
prompt-library/
├── api/                          # Vercel serverless functions
│   ├── categorize.ts            # AI auto-categorization
│   └── generate-embedding.ts    # Generate embeddings for semantic search
├── src/
│   ├── api/                     # API layer
│   │   └── prompts.ts          # Prompt CRUD operations
│   ├── components/
│   │   ├── auth/               # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── features/           # Feature components
│   │   │   ├── SearchBar.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   └── AppLayout.tsx
│   │   ├── prompts/            # Prompt components
│   │   │   ├── PromptCard.tsx
│   │   │   └── CreatePromptForm.tsx
│   │   └── ui/                 # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       └── Textarea.tsx
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/                  # Custom React hooks
│   │   └── usePrompts.ts
│   ├── lib/                    # Utilities and configuration
│   │   ├── supabase.ts        # Supabase client
│   │   └── utils.ts           # Helper functions
│   ├── pages/                  # Page components
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── Dashboard.tsx
│   ├── types/                  # TypeScript types
│   │   ├── database.ts        # Database types
│   │   └── index.ts           # App types
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles
├── supabase-schema.sql         # Database schema
├── .env.example                # Environment variables template
├── .env.local                  # Your local environment variables (git-ignored)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Database Schema

The application uses two main tables:

### `profiles`
- User profile information
- Automatically created when a user signs up

### `prompts`
- All prompt data
- Includes categories, tags, metadata
- Full-text search enabled
- Vector embeddings for semantic search (optional)

See `supabase-schema.sql` for complete schema.

## Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production

# Preview
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## Features Deep Dive

### Authentication
- Email/password authentication via Supabase Auth
- Protected routes require authentication
- Session persistence across page reloads

### Prompt Management
- Create prompts with title, text, description, category, and tags
- Edit and delete your own prompts
- Mark prompts as favorites
- Track usage count for each prompt

### Search & Filtering
- Full-text search across title, prompt text, and description
- Filter by category
- Filter by favorites
- Sort by date created, last updated, title, or usage count

### AI Features (Optional)
- **Auto-Categorization**: Automatically suggest categories and tags using GPT-3.5
- **Semantic Search**: Find similar prompts using vector embeddings
- Note: Requires OpenAI API key and incurs costs

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_OPENAI_API_KEY` | OpenAI API key for AI features | No |
| `OPENAI_API_KEY` | OpenAI API key for serverless functions | No |

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- API keys never exposed to client
- Secure authentication with Supabase Auth

## Cost Estimates

### Free Tier (5 users, 1000 prompts)
- **Supabase**: $0/month (within free tier)
- **Vercel**: $0/month (within free tier)
- **OpenAI**: ~$20-50/month (if using AI features)
- **Total**: $0-50/month

### Growth (100 users, 10k prompts)
- **Supabase Pro**: $25/month
- **Vercel**: $0-20/month
- **OpenAI**: ~$100-200/month
- **Total**: ~$125-245/month

## Troubleshooting

### Build Errors
- Make sure all environment variables are set
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Supabase Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that the database schema has been run
- Ensure RLS policies are properly configured

### Authentication Issues
- Clear browser cache and cookies
- Check Supabase Auth settings
- Verify email confirmation settings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial use.

## Support

For issues and questions:
- Check existing GitHub issues
- Create a new issue with detailed information
- Provide error messages and screenshots when possible

## Roadmap

### V2 Features
- [ ] Sharing prompts publicly
- [ ] Team workspaces
- [ ] Prompt versioning
- [ ] Import/export functionality
- [ ] Dark mode
- [ ] Mobile app

### V3+ Features
- [ ] AI testing playground
- [ ] Browser extension
- [ ] API for third-party integrations
- [ ] Advanced analytics

---

Built with ❤️ using React, TypeScript, Supabase, and OpenAI
