# ML Pathways — Technical Documentation

## Architecture Overview

```
Browser
  │
  ├── Next.js App Router (SSR + Client Components)
  │     ├── /dashboard, /problems, /datasets, /experiments  (static)
  │     ├── /workspace/[experimentId]                        (dynamic)
  │     └── /api/*                                           (edge/node)
  │
  ├── API Layer (src/app/api/)
  │     ├── /api/chat          → Anthropic / OpenAI / Gemini (streaming)
  │     ├── /api/generate-code → AI code generation
  │     ├── /api/execute       → E2B sandbox execution
  │     ├── /api/eda           → CSV analysis + AI summary
  │     ├── /api/datasets/*    → Dataset CRUD
  │     ├── /api/experiments/* → Experiment CRUD
  │     └── /api/auth/[...all] → BetterAuth handler
  │
  ├── Database: Neon Serverless Postgres via Drizzle ORM
  ├── Auth: BetterAuth (sessions in DB)
  ├── AI: claude-opus-4-6 / gpt-4-turbo-preview / gemini-pro
  ├── Execution: E2B Code Interpreter (isolated Python sandbox)
  └── Storage: Cloudflare R2 (optional, for large file uploads)
```

**Key architectural decisions:**

- **Lazy DB singleton** (`src/db/index.ts`): `getDb()` returns a cached Drizzle instance, returns `null` safely during build when `DATABASE_URL` is absent — allows `next build` without a live DB.
- **Multi-provider abstraction** (`src/lib/ai/providers.ts`): All three AI providers implement the same `chat()` interface. Provider selected via `AI_PROVIDER` env var.
- **Streaming chat**: `/api/chat` returns a `ReadableStream` via `new Response(stream)` — not `NextResponse.json`. Claude and OpenAI use native streaming SDKs; Gemini falls back to full response.
- **SVG safety**: SVG chart output from E2B is passed through `sanitizeSvg()` before rendering — strips `<script>` tags and inline event handler attributes to prevent injection attacks.

---

## Data Models / Schema

**Enums** (`src/db/schema.ts`):
- `mlProblemTypeEnum`: `linear_regression_single | linear_regression_multiple | logistic_regression | regularized_regression | polynomial_regression | multiclass_classification | neural_networks | kmeans_clustering | pca`
- `executionStatusEnum`: `pending | running | completed | failed`
- `datasetSourceEnum`: `sample | uploaded`

**Tables:**

| Table | PK | Key columns |
|---|---|---|
| `user` | `text id` | `name`, `email`, `emailVerified` |
| `session` | `text id` | `userId`, `token`, `expiresAt` |
| `account` | `text id` | `userId`, `providerId`, `password` |
| `verification` | `text id` | `identifier`, `value`, `expiresAt` |
| `datasets` | `uuid` | `userId`, `name`, `source`, `fileUrl`, `columnInfo` (JSONB), `rowCount` |
| `experiments` | `uuid` | `userId`, `datasetId`, `problemType`, `name`, `configuration` (JSONB) |
| `executions` | `uuid` | `experimentId`, `code`, `status`, `output`, `results` (JSONB), `visualizations` (JSONB) |
| `chat_messages` | `uuid` | `experimentId`, `role`, `content`, `metadata` (JSONB) |
| `eda_results` | `uuid` | `datasetId`, `statistics`, `correlations`, `distributions`, `missingValues`, `outliers` (all JSONB) |
| `sample_datasets` | `uuid` | `problemType`, `name`, `fileUrl`, `previewData` (JSONB), `isActive` |

**Notes:**
- BetterAuth tables use `text` PKs; application tables use `uuid` PKs.
- `experiments.datasetId` is nullable — experiments can exist before a dataset is assigned.
- `executions.visualizations` stores charts as `[{ type: "png" | "svg", data: string }]`.

---

## API Reference

All routes require authentication except `GET /api/auth/*`. Auth checked via `getSession(request)`; returns 401 if no session, 403 if resource belongs to another user.

### POST /api/chat
Stream an AI response token-by-token.

**Request body:**
```json
{
  "messages": [{ "role": "user", "content": "string" }],
  "problemType": "linear_regression_single",
  "context": "optional string"
}
```

**Response:** `text/plain` stream. Each chunk is raw text to append to the last assistant message. Errors emitted inline as `\n\n[Error: ...]`.

---

### POST /api/generate-code
Generate Python ML code via AI.

**Request body:**
```json
{
  "problemType": "logistic_regression",
  "task": "Train a model on housing data",
  "datasetInfo": { "columns": ["col1", "col2"], "rowCount": 500 }
}
```

**Response:** `{ "code": "...", "explanation": "...", "provider": "claude" }`

---

### POST /api/execute
Execute Python code in E2B sandbox.

**Request body:**
```json
{
  "code": "import pandas as pd ...",
  "datasetUrl": "/sample-data/housing-single.csv",
  "experimentId": "uuid (optional — triggers DB save)"
}
```

**Response:**
```json
{
  "status": "completed | error",
  "output": "stdout text",
  "charts": [{ "type": "png", "data": "base64..." }],
  "error": null
}
```

When `experimentId` is provided, a row is inserted into `executions` with charts persisted to `visualizations` JSONB.

---

### POST /api/eda
Run exploratory data analysis on a dataset.

**Request body:** `{ "datasetId": "uuid", "dataUrl": "/sample-data/..." }`

**Response:** `{ "analysis": { rowCount, columnCount, columns: [...], missingValues, summary } }`

---

### GET /api/datasets
Returns all datasets for the authenticated user.

### POST /api/datasets
Create a dataset record (after upload).

### POST /api/datasets/upload
Upload a CSV file. Validates type (CSV only) and size (max 10 MB). Parses headers and row count.

### DELETE /api/datasets/[datasetId]
Delete a dataset. Ownership-checked.

---

### GET /api/experiments
Returns all experiments for the authenticated user with joined dataset name.

### POST /api/experiments
Create a new experiment. Body: `{ name, problemType, datasetId? }`.

### GET /api/experiments/[experimentId]
Returns experiment + dataset + last 5 executions (with visualizations) + chat messages.

### DELETE /api/experiments/[experimentId]
Delete an experiment. Ownership-checked.

---

## Key Components / Modules

### `src/app/workspace/[experimentId]/page.tsx`
Main workspace. Three-tab layout: Chat & EDA / Code / Results, plus a sidebar. Key state:
- `messages` — chat history (streamed token-by-token via `handleSendMessage`)
- `generatedCode` — editable string; toggle between syntax-highlighted view and raw textarea
- `executionResult` — `{ status, output, charts[] }` — restored from DB on load
- `isEditingCode` — switches between view and edit mode

### `src/lib/ai/providers.ts`
`chatWithClaude`, `chatWithOpenAI`, `chatWithGemini` — all routed through `chat()`. Model: `claude-opus-4-6` / `gpt-4-turbo-preview` / `gemini-pro`.

### `src/lib/ai/prompts.ts`
`SYSTEM_PROMPTS` object + `getMLProblemContext(type)` which appends problem-specific instructions to the system prompt for each of the 9 ML types.

### `src/lib/constants/ml-problems.ts`
`ML_PROBLEMS` array (9 entries) with `id`, `name`, `category`, `icon`, `difficulty`, `sampleDatasetDescription`. `SAMPLE_DATASET_FILES` maps each type to its public CSV path.

### `src/lib/eda/analyzer.ts`
`performEDA(csvContent)` — PapaParse → per-column stats (mean/std/min/max for numeric, top values for categorical) + missing value counts.

### `src/components/layout/header.tsx`
Sticky nav with desktop links, theme toggle (using `resolvedTheme`), and mobile hamburger dropdown.

### `src/components/providers.tsx`
`ThemeProvider` from next-themes — `attribute="class"`, `defaultTheme="system"`, `enableSystem`.

---

## Auth Flow

1. User signs up/in via `/login` or `/signup`
2. BetterAuth writes session to `session` table, sets HTTP-only cookie
3. API routes call `getSession(request)` — validates cookie against `session` table
4. Returns `{ user: { id, email, name } }` or `null`
5. `null` → 401; wrong owner → 403

OAuth enabled via `GITHUB_CLIENT_ID/SECRET` and `GOOGLE_CLIENT_ID/SECRET` env vars.

---

## External Integrations

| Service | Purpose | Config |
|---|---|---|
| Neon | Serverless Postgres | `DATABASE_URL` |
| Anthropic | Claude Opus 4.6 (default) | `ANTHROPIC_API_KEY` |
| OpenAI | GPT-4 alternative | `OPENAI_API_KEY` |
| Google | Gemini alternative | `GOOGLE_API_KEY` |
| E2B | Sandboxed Python execution | `E2B_API_KEY` |
| Cloudflare R2 | File storage for large datasets | 4 R2 env vars |
| Sentry | Error monitoring | `SENTRY_DSN` |

---

## Configuration

**AI Provider selection:** `AI_PROVIDER=claude|openai|gemini` (default: `claude`).

**Streaming:** Chat uses `ReadableStream` + `TextEncoder`. Workspace client reads via `response.body.getReader()`. Gemini falls back to full response (no streaming SDK support).

**Sample data:** 9 CSV files in both `src/lib/sample-data/` (used by server-side routes) and `public/sample-data/` (served statically).

**Dark mode:** `darkMode: ["class"]` in Tailwind config. ThemeProvider injects `.dark` on `<html>`. Shadcn CSS vars auto-adapt; custom `bg-*`/`text-*` classes need explicit `dark:` variants.

---

## Session Log

### 2026-04-07 — Health Audit + 11 Unimplemented Features Implemented

**What was built / fixed:**

- **Infrastructure**: Restored `drizzle-kit` via `npm install`. Copied 7 missing sample CSVs to `public/sample-data/` (was 2/9, now 9/9).
- **DELETE /api/datasets/[id]**: New route with auth + ownership guard.
- **DELETE /api/experiments/[id]**: Confirmed and consolidated existing handler.
- **Visualization persistence**: `execute` route saves charts to `executions.visualizations` JSONB when `experimentId` provided. Workspace restores charts from DB on load.
- **Datasets page**: Replaced 2-item hardcoded list with `ML_PROBLEMS.map()` showing all 9 types. Fixed sample dataset links to point to `/problems/${type}`.
- **Delete UI**: Destructive delete buttons added to experiments and datasets list pages.
- **Editable code**: `isEditingCode` toggle in workspace — switches between highlighted view and editable textarea.
- **Mobile nav**: Hamburger button + dropdown nav in `header.tsx`.
- **Dark mode**: `next-themes` installed. `providers.tsx` created. Theme toggle using `resolvedTheme` (not `theme`) to handle system default correctly.
- **Streaming chat**: `/api/chat` rewritten to `ReadableStream`. Workspace `handleSendMessage` consumes stream via `getReader()` and appends chunks to last message.
- **Security + type safety**: `sanitizeSvg()` helper strips dangerous attributes from E2B SVG output. Replaced `any` types with `ColumnInfo`, `ColumnStats`, `ChartResult`, `ExperimentInfo`, `E2BResult`. Fixed stale closure — API payload captured before `setMessages` calls. Synced Claude model to `claude-opus-4-6` across `chat/route.ts` and `providers.ts`.

**Key files changed:**

- `src/app/api/chat/route.ts` — streaming rewrite
- `src/app/api/execute/route.ts` — DB persistence, static imports, typed results
- `src/app/api/datasets/[datasetId]/route.ts` — new DELETE endpoint
- `src/app/workspace/[experimentId]/page.tsx` — editable code, stream consumer, chart restore, typed state, SVG safety
- `src/app/datasets/page.tsx` — dynamic 9-item list, corrected links
- `src/app/experiments/page.tsx` — delete button
- `src/components/layout/header.tsx` — mobile nav + theme toggle
- `src/components/providers.tsx` — new ThemeProvider wrapper
- `src/app/layout.tsx` — wrapped with Providers
- `src/app/page.tsx` — dark mode variants
- `src/lib/ai/providers.ts` — model updated to `claude-opus-4-6`
- `public/sample-data/` — 7 CSV files added
- `Status.md` — new file
- `docs/documentation.md` — new file (this document)

**Patterns established:**

- DELETE endpoints: check DB → check session → query record → verify ownership → delete → `{ success: true }`.
- Streaming responses: `new Response(stream, { headers: { "Content-Type": "text/plain..." } })`.
- Use `resolvedTheme` (not `theme`) when `defaultTheme="system"` — `theme` stays `"system"` until user explicitly toggles.
- Capture API message history snapshot before any `setMessages` calls to avoid stale closure including optimistic UI updates.
- SVG output from sandboxed execution must be sanitized before inline rendering.
