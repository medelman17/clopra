# NJ OPRA Request Generator

A Next.js application that automatically generates comprehensive OPRA (Open Public Records Act) requests for New Jersey municipalities' rent control ordinances.

## Features

- 🔍 **Automatic Ordinance Discovery**: Uses Tavily API to search and extract rent control ordinances from municipal websites
- 📄 **Intelligent Text Processing**: Chunks ordinances into sections and generates embeddings for semantic search
- 🤖 **AI-Powered Analysis**: Analyzes ordinance content to determine relevant OPRA record categories
- 📋 **Customized Requests**: Generates tailored OPRA requests based on specific ordinance provisions
- 📧 **Custodian Information**: Automatically finds and includes municipal clerk contact details

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Neon PostgreSQL with pgvector
- **AI**: Vercel AI SDK (supports OpenAI, Anthropic Claude, and more)
- **Search**: Tavily API for web scraping
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Deployment**: Vercel

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables in `.env.local`:
   ```
   DATABASE_URL=your-neon-db-url
   DATABASE_URL_UNPOOLED=your-neon-db-unpooled-url
   TAVILY_API_KEY=your-tavily-api-key
   
   # AI Configuration (choose your provider)
   AI_PROVIDER=anthropic  # or 'openai'
   AI_CHAT_MODEL=claude-3-5-sonnet-20241022  # or 'gpt-4-turbo'
   
   # Provide API key for your chosen provider
   ANTHROPIC_API_KEY=your-anthropic-api-key
   OPENAI_API_KEY=your-openai-api-key
   ```

4. Set up the database:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

5. Run the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a New Jersey municipality name (e.g., "Atlantic Highlands")
2. Click "Search for Ordinance" to scrape the rent control ordinance
3. Once found, click "Process Ordinance" to chunk and embed the text
4. The system will analyze the ordinance and generate a customized OPRA request

## API Endpoints

- `POST /api/scrape` - Scrape a municipality's rent control ordinance
- `POST /api/ordinances/[id]/process` - Process an ordinance (chunk and embed)
- `POST /api/ordinances/[id]/analyze` - Analyze an ordinance for OPRA categories
- `POST /api/opra-requests/generate` - Generate an OPRA request

## Development

See `CLAUDE.md` for detailed development guidelines and architecture information.

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-repo%2Fopra-requests)