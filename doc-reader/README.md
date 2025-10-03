# Doc Reader - AI-Powered Documentation Guide Generator

Transform any documentation into comprehensive implementation guides using AI. Built with Next.js, OpenAI, Supabase, and Inngest.

## Features

- **Intelligent Scraping**: Automatically extracts content from HTML, PDFs, and GitHub releases
- **AI Guide Generation**: Creates comprehensive implementation guides using GPT-4o
- **RAG-Powered Chat**: Ask questions about your documentation with semantic search
- **Background Processing**: Long-running tasks handled by Inngest
- **Vector Search**: Fast semantic search using Supabase pgvector
- **Real-time Updates**: Progress tracking with automatic polling

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **AI**: OpenAI GPT-4o & text-embedding-3-small
- **Database**: Supabase (PostgreSQL + pgvector)
- **Background Jobs**: Inngest
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- Inngest account (for background processing)

### Installation

1. **Install dependencies**:

```bash
npm install
```

2. **Set up environment variables**:

Create a `.env.local` file based on `.env.local.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Inngest
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

3. **Set up Supabase**:

- Create a new Supabase project
- Run the migration in `supabase/migrations/001_initial_schema.sql`
- This will create all necessary tables, indexes, and enable pgvector

4. **Set up Inngest**:

- Create an Inngest account at https://inngest.com
- Create a new app and get your event key and signing key
- Add them to your `.env.local`

5. **Run the development server**:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Setting up Inngest locally

For local development with Inngest:

```bash
npx inngest-cli@latest dev
```

This will start the Inngest Dev Server at http://localhost:8288.

## How It Works

### 1. URL Processing Flow

1. User submits a documentation URL
2. System creates a guide record in Supabase
3. Inngest background job triggered
4. Content is scraped (Cheerio, Jina AI, or PDF parser)
5. Implementation guide generated with GPT-4o
6. Content chunked for RAG
7. Embeddings generated and stored
8. Guide marked as complete

### 2. RAG Chat Flow

1. User asks a question
2. Query is embedded using text-embedding-3-small
3. Similar chunks retrieved from pgvector
4. Context provided to GPT-4o via tool calling
5. Response streamed back to user

## Testing

Run Playwright tests:

```bash
npm run test:e2e
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Configure Inngest for Production

1. In Inngest dashboard, add your production Vercel URL
2. Inngest will send events to `https://your-domain.com/api/inngest`

## Cost Estimates

For 1000 guides per month:

- **OpenAI**: ~$60-160 (embeddings + generation)
- **Supabase**: $25 (Pro plan)
- **Vercel**: $20 (Pro plan)
- **Inngest**: Free tier sufficient for moderate use

**Total**: ~$105-205/month

## License

MIT
