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
- **AI**: Vercel AI SDK 4.3+ (supports multiple providers)
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
BLOB_READ_WRITE_TOKEN=

# AI Configuration
AI_PROVIDER=anthropic|openai
AI_CHAT_MODEL=claude-3-5-sonnet-20241022|gpt-4-turbo
AI_EMBEDDING_MODEL=text-embedding-3-small

# AI API Keys (at least one required)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Optional
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Development Workflow

1. All new features should include appropriate TypeScript types
2. Use Server Components by default, Client Components only when needed
3. Implement proper error boundaries and loading states
4. Use Prisma for all database operations
5. Cache expensive operations with Upstash Redis
6. Stream AI responses for better UX

## TODO List

### 🚀 High Priority - Core Functionality

#### UI/UX Improvements
- [ ] Create proper landing page with feature explanation
- [ ] Build municipality search/browse page with filtering
- [ ] Add loading skeletons for all async operations
- [ ] Implement error boundaries with user-friendly messages
- [ ] Add toast notifications for actions (success/error)
- [ ] Create mobile-responsive layouts

#### Request Management
- [ ] Build request history page showing all generated OPRAs
- [ ] Add request status tracking (draft, sent, responded, etc.)
- [ ] Implement request editing before PDF generation
- [ ] Create request templates for common scenarios
- [ ] Add ability to regenerate PDFs with modifications

#### Ordinance Management
- [ ] Build ordinance viewer with syntax highlighting
- [ ] Add side-by-side comparison view (ordinance + OPRA)
- [ ] Implement ordinance search functionality
- [ ] Create ordinance update detection system
- [ ] Add manual ordinance text input option

### 🛡️ Medium Priority - Production Readiness

#### Security & Performance
- [ ] Implement rate limiting with Upstash Redis
- [ ] Add request caching for repeated operations
- [ ] Set up background jobs for long-running tasks
- [ ] Implement proper API key management
- [ ] Add request validation and sanitization

#### Data Management
- [ ] Create data export functionality (CSV, JSON)
- [ ] Implement soft deletes for all records
- [ ] Add audit logging for all operations
- [ ] Build backup and restore functionality
- [ ] Create data retention policies

#### Integration Features
- [ ] Add email integration to send requests directly
- [ ] Implement webhook notifications for status updates
- [ ] Create public API for third-party integrations
- [ ] Add calendar integration for deadline tracking
- [ ] Build Zapier/Make.com integration

### 🎯 Low Priority - Nice to Have

#### Advanced Features
- [ ] Implement user authentication and accounts
- [ ] Create organization/team functionality
- [ ] Build analytics dashboard with insights
- [ ] Add multi-language support
- [ ] Create browser extension for quick scraping

#### Developer Experience
- [ ] Add comprehensive test suite (unit, integration, e2e)
- [ ] Create API documentation with examples
- [ ] Build developer portal with API keys
- [ ] Add performance monitoring (Sentry, LogRocket)
- [ ] Create contribution guidelines

#### Business Features
- [ ] Implement usage-based billing
- [ ] Add subscription management
- [ ] Create admin dashboard
- [ ] Build customer support tools
- [ ] Add white-label options

### 🐛 Bug Fixes & Improvements

- [ ] Fix ESLint warnings in build
- [ ] Improve TypeScript strict mode compliance
- [ ] Optimize bundle size
- [ ] Add proper SEO meta tags
- [ ] Implement proper accessibility (WCAG 2.1)

### 📚 Documentation Needs

- [ ] Create user guide with screenshots
- [ ] Write API documentation
- [ ] Add inline code documentation
- [ ] Create video tutorials
- [ ] Build interactive demo

### 🧪 Testing Requirements

- [ ] Unit tests for all utility functions
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Performance testing for vector search
- [ ] Load testing for concurrent users