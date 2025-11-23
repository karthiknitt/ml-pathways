# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server on http://localhost:3000
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database (Drizzle ORM)
npm run db:generate     # Generate migration files from schema changes
npm run db:push         # Push schema to database (use for development)
npm run db:migrate      # Run migrations (use for production)
npm run db:studio       # Open Drizzle Studio UI to inspect database
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19 and TypeScript
- **Database**: Neon Serverless Postgres with Drizzle ORM
- **Authentication**: BetterAuth with email/password and OAuth (GitHub, Google)
- **AI Providers**: Multi-provider support (OpenAI GPT-4, Anthropic Claude, Google Gemini)
- **Code Execution**: E2B Code Interpreter for sandboxed Python execution
- **UI**: Shadcn UI components with Tailwind CSS
- **Visualizations**: Plotly.js and Recharts
- **Monitoring**: Sentry (optional)

### Core Application Flow

ML Pathways is an interactive ML learning platform with this workflow:
1. User selects an ML problem type (9 types: linear regression, logistic regression, neural networks, etc.)
2. User chooses a sample dataset or uploads their own CSV
3. User chats with AI assistant for guidance and exploratory data analysis
4. AI generates production-ready Python code for the ML task
5. Code executes in E2B sandboxed environment
6. Results, visualizations, and metrics display in the UI
7. Experiments are saved to database for tracking

### AI Provider System

The application uses a **multi-provider abstraction** in `src/lib/ai/providers.ts`:
- All three providers (OpenAI, Claude, Gemini) implement the same interface
- Provider selection is controlled via `AI_PROVIDER` environment variable
- Each provider has a dedicated chat function: `chatWithOpenAI()`, `chatWithClaude()`, `chatWithGemini()`
- Main `chat()` function routes to the appropriate provider
- **Important**: Claude uses separate system messages; OpenAI/Gemini include them in conversation

System prompts in `src/lib/ai/prompts.ts` provide context for:
- General ML assistance and teaching
- Exploratory data analysis
- Code generation
- Result interpretation
- Problem-specific context for each of the 9 ML problem types

### Database Architecture

**Key Pattern**: Database connection uses lazy singleton pattern in `src/db/index.ts`:
- `getDb()` returns cached Drizzle instance or creates new one
- Handles missing `DATABASE_URL` during build time gracefully
- Uses Neon serverless driver with connection pooling

**Schema Organization** (`src/db/schema.ts`):
- BetterAuth tables: `user`, `session`, `account`, `verification`
- Application tables: `datasets`, `experiments`, `executions`, `chatMessages`, `edaResults`, `sampleDatasets`
- Enums: `mlProblemTypeEnum` (9 problem types), `executionStatusEnum`, `datasetSourceEnum`
- All tables use UUID primary keys except auth tables (text IDs)
- JSONB columns store flexible data: `configuration`, `results`, `visualizations`, `metadata`

**Important**: When adding new ML problem types:
1. Add to `mlProblemTypeEnum` in schema
2. Define in `ML_PROBLEMS` array in `src/lib/constants/ml-problems.ts`
3. Add problem context to `getMLProblemContext()` in `src/lib/ai/prompts.ts`
4. Create sample dataset in `src/lib/sample-data/`
5. Run `npm run db:push` to update database schema

### API Routes

Located in `src/app/api/`:
- `/api/chat` - Chat with AI assistant (multi-provider support)
- `/api/generate-code` - Generate Python ML code via AI
- `/api/execute` - Execute Python code in E2B sandbox
- `/api/eda` - Perform exploratory data analysis
- `/api/datasets/*` - Dataset management and upload
- `/api/experiments/*` - Experiment CRUD operations
- `/api/auth/[...all]` - BetterAuth catch-all route

**Code Execution Pattern** (`src/app/api/execute/route.ts`):
- Checks for E2B API key; returns helpful setup message if missing
- Dynamically imports E2B module to handle installation issues
- Downloads dataset via `requests` if `datasetUrl` provided
- Executes code in Jupyter-style notebook cell
- Extracts plots (PNG/SVG) from execution results
- Always closes sandbox after execution (even on error)

### Authentication

BetterAuth configuration in `src/lib/auth.ts`:
- Lazy initialization pattern similar to database
- Uses Drizzle adapter with PostgreSQL
- Email/password enabled by default
- OAuth (GitHub/Google) enabled if credentials provided
- Exports proxy object for compatibility
- Returns null during build if database unavailable

### Path Aliases

TypeScript uses `@/*` alias for `src/*` (configured in `tsconfig.json`)

Example: `import { getDb } from "@/db"`

### Environment Variables

Required:
- `DATABASE_URL` - Neon Postgres connection string
- At least one of: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`

Optional:
- `AI_PROVIDER` - Default provider (claude, openai, or gemini)
- `E2B_API_KEY` - For code execution
- `BETTER_AUTH_SECRET` - For authentication
- OAuth credentials for GitHub/Google
- Cloudflare R2 credentials for file storage
- `SENTRY_DSN` for monitoring

See `.env.example` for complete list.

### ML Problem Types

9 problem types defined in `src/lib/constants/ml-problems.ts`:
- **Regression**: linear (single/multiple), regularized, polynomial
- **Classification**: logistic, multiclass, neural networks
- **Clustering**: k-means
- **Dimensionality Reduction**: PCA

Each problem has: id, name, description, category, icon, sample dataset description, difficulty level

### Important Patterns

**Build-time Safety**: Database and auth connections handle missing environment variables during build:
```typescript
if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("DATABASE_URL required");
  }
  return null as any; // Dummy for build
}
```

**Multi-provider Error Handling**: Each AI provider has separate error handling with clear messages about missing API keys.

**E2B Dynamic Import**: Code execution uses dynamic import to handle package issues gracefully and provides helpful setup instructions when not configured.
