# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application for generating comprehensive OPRA (Open Public Records Act) requests to New Jersey municipalities regarding rent control ordinances. The system scrapes municipal websites, analyzes rent control ordinances, and generates tailored OPRA requests as PDFs.

## Tech Stack

- **Framework**: Next.js 15.2+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Neon PostgreSQL with pgvector extension
- **ORM**: Prisma
- **Storage**: Vercel Blob (for PDFs)
- **Cache**: Upstash Redis
- **AI**: Vercel AI SDK 5.0 (beta)
- **Vector Search**: Neon pgvector or Upstash Vector
- **Hosting**: Vercel

## Common Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run Prisma migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Run tests
pnpm test

# Run a single test file
pnpm test path/to/test.test.ts
```

## Architecture

The application follows a monolithic Next.js App Router structure:

### API Design
- **Route Handlers** in `/app/api/` for REST endpoints
- **Server Actions** for mutations (form submissions, data updates)
- **Edge Runtime** where possible for better performance
- **Streaming responses** for large data sets

### Data Flow
1. **Scraping**: Tavily API searches municipal websites for rent control ordinances
2. **Processing**: Extract, clean, and chunk ordinance text
3. **Vectorization**: Generate embeddings using Vercel AI SDK
4. **Storage**: Store in Neon PostgreSQL with pgvector
5. **Analysis**: Match ordinance sections to OPRA request categories
6. **Generation**: Create tailored OPRA requests as PDFs

### Key Services
- **Ordinance Scraper**: Uses Tavily to find and extract rent control ordinances
- **Text Processor**: Chunks ordinances intelligently by section
- **Vector Store**: Semantic search using pgvector or Upstash Vector
- **OPRA Generator**: Analyzes ordinances and generates tailored requests
- **PDF Service**: Creates formatted OPRA request PDFs using Vercel Blob

### Database Schema
- `municipalities`: NJ municipality information
- `ordinances`: Full text and metadata
- `ordinance_chunks`: Vectorized sections for semantic search
- `opra_requests`: Generated requests and their status
- `custodians`: Municipal clerk contact information

### Environment Variables
Required in `.env.local`:
```
DATABASE_URL=
DATABASE_URL_UNPOOLED=
TAVILY_API_KEY=
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
BLOB_READ_WRITE_TOKEN=
```

## Development Workflow

1. All new features should include appropriate TypeScript types
2. Use Server Components by default, Client Components only when needed
3. Implement proper error boundaries and loading states
4. Use Prisma for all database operations
5. Cache expensive operations with Upstash Redis
6. Stream AI responses for better UX