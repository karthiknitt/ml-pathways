# ML Pathways

> An interactive machine learning learning platform — explore foundational ML algorithms through AI-guided, hands-on experimentation.

## Overview

ML Pathways is a web application that lets users work through 9 ML problem types (regression, classification, clustering, dimensionality reduction) using real datasets and live code execution. An AI assistant (Claude, GPT-4, or Gemini) guides each session via streaming chat, generates production-ready Python code, and helps interpret results. Code runs in an isolated E2B sandbox; all experiments, chat history, and visualizations are persisted to a Neon Postgres database.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict |
| UI | Shadcn UI, Tailwind CSS v3, next-themes (dark/light mode) |
| Database | Neon Serverless Postgres + Drizzle ORM |
| Auth | BetterAuth (email/password + OAuth) |
| AI Providers | Anthropic Claude Opus 4.6, OpenAI GPT-4, Google Gemini |
| Code Execution | E2B Code Interpreter (sandboxed Python) |
| File Storage | Cloudflare R2 (optional) |
| Charts | Plotly.js, Recharts, react-syntax-highlighter |
| Monitoring | Sentry (optional) |
| E2E Testing | Playwright |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+, npm
- Neon Postgres database ([neon.tech](https://neon.tech))
- At least one AI provider key (Anthropic, OpenAI, or Google)
- E2B API key for code execution ([e2b.dev](https://e2b.dev)) — optional but strongly recommended

### Setup

```bash
# 1. Clone and install
git clone https://github.com/karthiknitt/ml-pathways.git
cd ml-pathways
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, ANTHROPIC_API_KEY (or OPENAI_API_KEY), E2B_API_KEY

# 3. Push schema to database
npm run db:push

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running Locally

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Production server
```

## Features

- **9 ML problem types** — linear/multiple/polynomial/regularized regression, logistic regression, multiclass classification, neural networks, k-means clustering, PCA
- **Streaming AI chat** — token-by-token responses via Claude Opus 4.6, GPT-4, or Gemini
- **AI code generation** — produces runnable Python with scikit-learn, pandas, matplotlib
- **Sandboxed execution** — E2B runs generated code safely; charts returned as base64 PNG/SVG
- **Visualization persistence** — charts saved to DB, restored on page refresh
- **Automated EDA** — column statistics, missing value analysis, top-value distribution
- **All 9 sample datasets** — CSV files served from `public/sample-data/`
- **Custom dataset upload** — CSV files up to 10 MB, parsed client-side with PapaParse
- **Editable code** — generated code can be modified in a textarea before running
- **Dark mode / light mode** — system default with manual toggle in nav
- **Mobile responsive** — hamburger nav for small screens
- **Experiment management** — create, open, and delete experiments
- **Dataset management** — upload, list, and delete datasets
- **Authentication** — email/password and OAuth (GitHub, Google)

## Project Structure

```
ml-pathways/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...all]/     # BetterAuth catch-all
│   │   │   ├── chat/              # Streaming AI chat
│   │   │   ├── datasets/          # Dataset CRUD + upload
│   │   │   │   └── [datasetId]/   # DELETE /api/datasets/:id
│   │   │   ├── eda/               # Exploratory data analysis
│   │   │   ├── execute/           # E2B code execution
│   │   │   ├── experiments/       # Experiment CRUD
│   │   │   │   └── [experimentId]/# GET + DELETE /api/experiments/:id
│   │   │   └── generate-code/     # AI code generation
│   │   ├── dashboard/             # User dashboard (stats + quick actions)
│   │   ├── datasets/              # Dataset listing + upload UI
│   │   ├── experiments/           # Experiment list UI
│   │   ├── login/ signup/         # Auth pages
│   │   ├── problems/[problemId]/  # ML problem detail + experiment creation
│   │   ├── workspace/[experimentId]/ # Main workspace (chat, code, results)
│   │   └── layout.tsx / page.tsx  # Root layout + landing page
│   ├── components/
│   │   ├── layout/header.tsx      # Sticky nav (desktop + mobile, theme toggle)
│   │   ├── providers.tsx          # ThemeProvider wrapper
│   │   └── ui/                    # Shadcn components
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema (all tables + enums)
│   │   └── index.ts               # Lazy singleton DB connection
│   └── lib/
│       ├── ai/
│       │   ├── providers.ts       # chatWithClaude / chatWithOpenAI / chatWithGemini
│       │   └── prompts.ts         # System prompts + ML problem context
│       ├── constants/ml-problems.ts # ML_PROBLEMS array + SAMPLE_DATASET_FILES map
│       ├── eda/analyzer.ts        # EDA logic (statistics, missing values)
│       └── sample-data/           # Source CSVs (also copied to public/sample-data/)
├── public/sample-data/            # 9 CSV files served statically
├── e2e/                           # Playwright tests
├── docs/
│   ├── plans/                     # Implementation plans
│   └── documentation.md           # Technical reference
├── .env.example                   # All environment variable keys
└── Status.md                      # Feature completion + known limitations
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `ANTHROPIC_API_KEY` | One of three | Claude Opus 4.6 |
| `OPENAI_API_KEY` | One of three | GPT-4 |
| `GOOGLE_API_KEY` | One of three | Gemini |
| `AI_PROVIDER` | No | `claude` (default), `openai`, or `gemini` |
| `E2B_API_KEY` | Recommended | Sandboxed code execution |
| `BETTER_AUTH_SECRET` | No | Session signing secret |
| `BETTER_AUTH_URL` | No | Base URL (default: http://localhost:3000) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | No | Client-visible base URL |
| `GITHUB_CLIENT_ID/SECRET` | No | GitHub OAuth |
| `GOOGLE_CLIENT_ID/SECRET` | No | Google OAuth |
| `CLOUDFLARE_R2_*` | No | File storage (4 vars) |
| `SENTRY_DSN` | No | Error monitoring |

See `.env.example` for the full list.

## Development Commands

```bash
npm run dev           # Dev server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run test          # Playwright e2e tests
npm run test:ui       # Playwright UI mode
npm run db:generate   # Generate Drizzle migrations
npm run db:push       # Push schema to DB (development)
npm run db:migrate    # Run migrations (production)
npm run db:studio     # Drizzle Studio GUI
```

## Conventions

- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **TypeScript**: `strict: true` — no `any`, use `unknown` in catch blocks
- **Paths**: `@/*` alias for `src/*`
- **Auth guards**: All API routes check session via `getSession(request)` before any DB access
- **Ownership checks**: All mutating routes verify `record.userId === session.user.id`
- **Build-time safety**: DB and auth connections return `null` gracefully when `DATABASE_URL` is absent

## Adding a New ML Problem Type

1. Add enum value to `mlProblemTypeEnum` in `src/db/schema.ts`
2. Add entry to `ML_PROBLEMS` and `SAMPLE_DATASET_FILES` in `src/lib/constants/ml-problems.ts`
3. Add problem context to `getMLProblemContext()` in `src/lib/ai/prompts.ts`
4. Add CSV to `src/lib/sample-data/` and copy to `public/sample-data/`
5. Run `npm run db:push`

## License

MIT
