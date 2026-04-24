# ML Pathways — Unimplemented Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 11 unimplemented or incomplete features discovered during the health audit, restoring full platform functionality.

**Architecture:** Three phases — (1) infrastructure fixes that unblock everything else, (2) data-layer gaps (API endpoints + DB persistence), (3) UX enhancements (mobile nav, dark mode, streaming, editable code). Each phase can be committed independently.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Drizzle ORM, BetterAuth, Shadcn UI, Tailwind CSS, next-themes (to be installed for dark mode), npm (not bun — follow project CLAUDE.md).

---

## Phase 1 — Infrastructure (Blocking Fixes)

### Task 1: Install missing `drizzle-kit` and copy sample CSV files

**Why:** `drizzle-kit` is listed in `package.json` devDependencies but missing from `node_modules` — all `db:*` scripts fail. Also, `public/sample-data/` has only 2 of 9 CSV files; the other 7 exist in `src/lib/sample-data/` and just need copying.

**Files:**
- No code changes — shell commands only

**Step 1: Install node modules**

```bash
npm install
```

Expected: drizzle-kit appears in `node_modules/.bin/drizzle-kit`

**Step 2: Verify drizzle-kit works**

```bash
npm run db:generate -- --help 2>&1 | head -5
```

Expected: prints drizzle-kit usage, no "not found" error

**Step 3: Copy the 7 missing sample CSV files to public/**

```bash
cp src/lib/sample-data/housing-multiple.csv public/sample-data/
cp src/lib/sample-data/regularized-pricing.csv public/sample-data/
cp src/lib/sample-data/population-growth.csv public/sample-data/
cp src/lib/sample-data/digits.csv public/sample-data/
cp src/lib/sample-data/images.csv public/sample-data/
cp src/lib/sample-data/customer-segments.csv public/sample-data/
cp src/lib/sample-data/high-dimensional.csv public/sample-data/
```

**Step 4: Verify all 9 files are present**

```bash
ls public/sample-data/ | sort
```

Expected output (9 files):
```
admissions.csv
customer-segments.csv
digits.csv
high-dimensional.csv
housing-multiple.csv
housing-single.csv
images.csv
population-growth.csv
regularized-pricing.csv
```

**Step 5: Commit**

```bash
git add public/sample-data/
git commit -m "fix: add missing sample CSV files to public/sample-data"
```

---

## Phase 2 — Data Layer

### Task 2: Add DELETE endpoint for experiments

**Why:** The experiments list has no delete capability. The API has GET and POST but no DELETE.

**Files:**
- Modify: `src/app/api/experiments/[experimentId]/route.ts` — add DELETE handler

**Step 1: Read the existing file**

```bash
cat "src/app/api/experiments/[experimentId]/route.ts"
```

**Step 2: Add DELETE handler to the file**

At the end of `src/app/api/experiments/[experimentId]/route.ts`, add:

```typescript
// DELETE /api/experiments/[experimentId] - Delete an experiment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const { experimentId } = await params;
    const database = db();
    if (!database) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership before deleting
    const [existing] = await database
      .select({ id: experiments.id, userId: experiments.userId })
      .from(experiments)
      .where(eq(experiments.id, experimentId));

    if (!existing) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await database.delete(experiments).where(eq(experiments.id, experimentId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete experiment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete experiment" },
      { status: 500 }
    );
  }
}
```

**Step 3: Test with curl (requires running dev server)**

```bash
# Start dev server in another terminal first: npm run dev
curl -X DELETE http://localhost:3000/api/experiments/nonexistent-id \
  -H "Content-Type: application/json" | jq .
```

Expected: `{"error":"Unauthorized"}` (since no session in curl)

**Step 4: Commit**

```bash
git add "src/app/api/experiments/[experimentId]/route.ts"
git commit -m "feat: add DELETE endpoint for experiments"
```

---

### Task 3: Add DELETE endpoint for datasets

**Why:** Same gap as experiments — no delete capability for uploaded datasets.

**Files:**
- Create: `src/app/api/datasets/[datasetId]/route.ts`

**Step 1: Create the file**

```typescript
// src/app/api/datasets/[datasetId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { datasets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  try {
    const { datasetId } = await params;
    const database = db();
    if (!database) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [existing] = await database
      .select({ id: datasets.id, userId: datasets.userId })
      .from(datasets)
      .where(eq(datasets.id, datasetId));

    if (!existing) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await database.delete(datasets).where(eq(datasets.id, datasetId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete dataset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete dataset" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/datasets/
git commit -m "feat: add DELETE endpoint for datasets"
```

---

### Task 4: Persist visualizations from code execution

**Why:** Charts generated during code execution are returned to the frontend but never saved to the `visualizations` JSONB column in the `executions` table. Refreshing the workspace loses all charts.

**Files:**
- Modify: `src/app/api/execute/route.ts`
- Modify: `src/app/api/experiments/[experimentId]/route.ts` — return saved visualizations on load

**Step 1: Find where the execution record is saved in execute/route.ts**

```bash
grep -n "insert\|update\|executions" src/app/api/execute/route.ts
```

**Step 2: Update the execute route to persist charts**

In `src/app/api/execute/route.ts`, find the section that inserts/updates an execution record and ensure the `visualizations` and `results` columns are populated. The exact location depends on the current code — read the file first, then add this logic wherever the execution completes:

```typescript
// After extracting charts from the sandbox result, before closing sandbox:
// Save execution with visualizations to DB if experimentId provided
const { experimentId } = body; // add this to the destructured body at top

if (experimentId) {
  const database = db();
  if (database) {
    const { executions } = await import("@/db/schema");
    await database.insert(executions).values({
      experimentId,
      code,
      status: "completed",
      output: outputText,
      results: { output: outputText },
      visualizations: charts, // charts array with {type, data} objects
      executionTime: Date.now() - startTime,
    });
  }
}
```

**Step 3: Update the experiment fetch to return saved visualizations**

In `src/app/api/experiments/[experimentId]/route.ts`, find where executions are returned. Ensure `visualizations` field is included in the select:

```typescript
// In the executions query, ensure visualizations is selected:
const experimentExecutions = await database
  .select({
    id: executions.id,
    code: executions.code,
    status: executions.status,
    output: executions.output,
    visualizations: executions.visualizations, // ADD THIS
    createdAt: executions.createdAt,
  })
  .from(executions)
  .where(eq(executions.experimentId, experimentId))
  .orderBy(desc(executions.createdAt))
  .limit(5);
```

**Step 4: Update workspace page to restore saved charts on load**

In `src/app/workspace/[experimentId]/page.tsx`, find the section that loads the latest execution (around line 88-100) and restore charts:

```typescript
if (data.executions && data.executions.length > 0) {
  const latest = data.executions[0];
  if (latest.code) {
    setGeneratedCode(latest.code);
  }
  if (latest.status === "completed") {
    setExecutionResult({
      status: latest.status,
      output: latest.output || "",
      charts: latest.visualizations || [], // ADD THIS LINE
    });
  }
}
```

**Step 5: Commit**

```bash
git add src/app/api/execute/route.ts "src/app/api/experiments/[experimentId]/route.ts" "src/app/workspace/[experimentId]/page.tsx"
git commit -m "feat: persist and restore visualizations from code execution"
```

---

### Task 5: Fix datasets page — show all 9 sample datasets with correct links

**Why:** `src/app/datasets/page.tsx` has a hardcoded array of 2 samples. The `ML_PROBLEMS` constant already has all 9. "Use Dataset" should link to `/problems/[problemId]` not `/problems`.

**Files:**
- Modify: `src/app/datasets/page.tsx`

**Step 1: Replace the hardcoded sampleDatasets array**

In `src/app/datasets/page.tsx`, replace:

```typescript
  const sampleDatasets = [
    {
      name: "Housing Prices",
      description: "Predict housing prices based on size, rooms, and location",
      category: "Regression",
      type: "linear_regression_single",
    },
    {
      name: "University Admissions",
      description: "Binary classification for admission prediction",
      category: "Classification",
      type: "logistic_regression",
    },
  ];
```

With:

```typescript
  // Derive sample datasets from the canonical ML_PROBLEMS constant
  import { ML_PROBLEMS } from "@/lib/constants/ml-problems";
  // (move import to top of file)
  const sampleDatasets = ML_PROBLEMS.map((p) => ({
    name: p.name,
    description: p.sampleDatasetDescription,
    category: p.category.charAt(0).toUpperCase() + p.category.slice(1).replace(/_/g, " "),
    type: p.id,
    difficulty: p.difficulty,
    icon: p.icon,
  }));
```

**Step 2: Fix the "Use This Dataset" button link**

In the sample datasets card section, change:

```typescript
<Button asChild size="sm" variant="outline" className="w-full">
  <Link href={`/problems`}>Use This Dataset</Link>
</Button>
```

To:

```typescript
<Button asChild size="sm" variant="outline" className="w-full">
  <Link href={`/problems/${sample.type}`}>Use This Dataset</Link>
</Button>
```

**Step 3: Fix the "Use in Experiment" button for uploaded datasets**

Change:

```typescript
<Button asChild size="sm" variant="outline">
  <Link href={`/problems`}>Use in Experiment</Link>
</Button>
```

To:

```typescript
<Button asChild size="sm" variant="outline">
  <Link href={`/problems`}>Choose Problem Type</Link>
</Button>
```

(uploaded datasets don't have a problem type pre-assigned, so going to /problems to choose is correct — just fix the label to be accurate)

**Step 4: Add the ML_PROBLEMS import at the top of the file**

```typescript
import { ML_PROBLEMS } from "@/lib/constants/ml-problems";
```

**Step 5: Commit**

```bash
git add src/app/datasets/page.tsx
git commit -m "fix: show all 9 ML problem sample datasets with correct links"
```

---

## Phase 3 — UX Enhancements

### Task 6: Add delete UI to experiments and datasets pages

**Why:** The DELETE API endpoints now exist (Tasks 2 & 3) but nothing in the UI calls them.

**Files:**
- Modify: `src/app/experiments/page.tsx`
- Modify: `src/app/datasets/page.tsx`

**Step 1: Add delete handler to experiments page**

In `src/app/experiments/page.tsx`, add this function alongside `fetchExperiments`:

```typescript
const handleDelete = async (id: string, name: string) => {
  if (!confirm(`Delete experiment "${name}"? This cannot be undone.`)) return;
  try {
    const response = await fetch(`/api/experiments/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete");
    setExperiments((prev) => prev.filter((e) => e.id !== id));
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
};
```

**Step 2: Add delete button next to "Open Workspace" in the experiment list**

In the experiment card, after the "Open Workspace" button:

```typescript
<div className="flex gap-2">
  <Button asChild size="sm">
    <Link href={`/workspace/${experiment.id}`}>Open Workspace</Link>
  </Button>
  <Button
    size="sm"
    variant="destructive"
    onClick={() => handleDelete(experiment.id, experiment.name)}
  >
    Delete
  </Button>
</div>
```

**Step 3: Add delete handler to datasets page**

In `src/app/datasets/page.tsx`, add:

```typescript
const handleDeleteDataset = async (id: string, name: string) => {
  if (!confirm(`Delete dataset "${name}"? This cannot be undone.`)) return;
  try {
    const response = await fetch(`/api/datasets/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete");
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
};
```

**Step 4: Add delete button to uploaded datasets**

In the uploaded datasets list section, add alongside the existing button:

```typescript
<div className="flex gap-2">
  <Button asChild size="sm" variant="outline">
    <Link href="/problems">Choose Problem Type</Link>
  </Button>
  <Button
    size="sm"
    variant="destructive"
    onClick={() => handleDeleteDataset(dataset.id, dataset.name)}
  >
    Delete
  </Button>
</div>
```

**Step 5: Add `useState` for `datasets` if not already present**

The datasets page currently fetches and sets state — verify `const [datasets, setDatasets] = useState<Dataset[]>([])` exists (it does, confirmed from reading the file).

**Step 6: Commit**

```bash
git add src/app/experiments/page.tsx src/app/datasets/page.tsx
git commit -m "feat: add delete buttons to experiments and datasets pages"
```

---

### Task 7: Make generated code editable in workspace

**Why:** The workspace shows generated Python code in a read-only `SyntaxHighlighter`. Users need to tweak code before running — this is a core learning workflow.

**Files:**
- Modify: `src/app/workspace/[experimentId]/page.tsx`

**Step 1: Add an edit mode state variable**

Near the other `useState` declarations (around line 60):

```typescript
const [isEditingCode, setIsEditingCode] = useState(false);
```

**Step 2: Replace the code tab content with a toggle between view and edit modes**

In the `TabsContent value="code"` section (around line 374), replace the display block:

```typescript
<TabsContent value="code">
  <Card>
    <CardHeader>
      <CardTitle>Generated Code</CardTitle>
      <CardDescription>Python code for your ML experiment — edit before running</CardDescription>
    </CardHeader>
    <CardContent>
      {generatedCode ? (
        <>
          {isEditingCode ? (
            <textarea
              className="w-full h-96 font-mono text-sm p-4 border rounded-lg bg-gray-950 text-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={generatedCode}
              onChange={(e) => setGeneratedCode(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <div className="rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: "1rem", fontSize: "0.875rem" }}
                showLineNumbers
              >
                {generatedCode}
              </SyntaxHighlighter>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleRunCode} disabled={executing}>
              {executing ? "Running..." : "Run Code"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditingCode((prev) => !prev)}
            >
              {isEditingCode ? "Preview" : "Edit Code"}
            </Button>
            <Button variant="outline" onClick={handleCopyCode}>
              Copy
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No code generated yet</p>
          <Button onClick={handleGenerateCode} disabled={loading}>
            {loading ? "Generating..." : "Generate Sample Code"}
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

**Step 3: Commit**

```bash
git add "src/app/workspace/[experimentId]/page.tsx"
git commit -m "feat: make generated code editable before execution"
```

---

### Task 8: Add mobile navigation hamburger menu

**Why:** The nav links are hidden on mobile (`hidden md:flex`) with no replacement, making the app unusable on phones.

**Files:**
- Modify: `src/components/layout/header.tsx`

**Step 1: Add mobile menu state**

```typescript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
```

**Step 2: Add hamburger button and mobile dropdown**

Replace the entire `<header>` content with this updated version:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/problems", label: "ML Problems" },
  { href: "/datasets", label: "Datasets" },
  { href: "/experiments", label: "My Experiments" },
];

export function Header() {
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-xl">ML Pathways</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {isPending ? (
            <div className="w-20 h-9 bg-gray-100 animate-pulse rounded" />
          ) : session ? (
            <>
              <span className="text-sm text-gray-600 hidden md:inline">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut} className="hidden md:inline-flex">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild className="hidden md:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-gray-950 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t space-y-2">
            {session ? (
              <>
                <p className="text-sm text-gray-500">{session.user?.name || session.user?.email}</p>
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add mobile hamburger navigation menu"
```

---

### Task 9: Add dark mode / light mode with next-themes

**Why:** CLAUDE.md project guidelines require dark + light mode via Shadcn and next-themes. Currently zero theming is implemented.

**Files:**
- Install: `next-themes`
- Create: `src/components/providers.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/header.tsx` — add theme toggle button
- Modify: `tailwind.config.ts` — enable `darkMode: 'class'`

**Step 1: Install next-themes**

```bash
npm install next-themes
```

**Step 2: Create a providers wrapper**

Create `src/components/providers.tsx`:

```typescript
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
```

**Step 3: Read the current layout.tsx**

```bash
cat src/app/layout.tsx
```

**Step 4: Wrap the layout body with Providers**

In `src/app/layout.tsx`, add the import and wrap `{children}`:

```typescript
import { Providers } from "@/components/providers";

// In the return, wrap children:
<body className={inter.className}>
  <Providers>
    {children}
  </Providers>
</body>
```

**Step 5: Enable dark mode in Tailwind config**

Read `tailwind.config.ts` first, then add/update:

```typescript
// tailwind.config.ts
const config = {
  darkMode: "class",  // ADD THIS
  // ...rest of config
};
```

**Step 6: Add theme toggle button to header**

In `src/components/layout/header.tsx`, import and add a toggle:

```typescript
import { useTheme } from "next-themes";

// Inside the component:
const { theme, setTheme } = useTheme();

// Add this button before the hamburger button in desktop nav area:
<button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100"
  aria-label="Toggle theme"
>
  {theme === "dark" ? "☀️" : "🌙"}
</button>
```

**Step 7: Add dark mode classes to main pages**

The Shadcn components already use CSS variables that respond to `.dark` class. But backgrounds need updating. In each page's outer `<div>`, add dark mode variants:

Example changes needed:
- `bg-white` → `bg-white dark:bg-gray-950`
- `text-gray-600` → `text-gray-600 dark:text-gray-400`
- `bg-gray-50` → `bg-gray-50 dark:bg-gray-900`
- `bg-gray-100` → `bg-gray-100 dark:bg-gray-800`
- `border-b bg-white` in header → already done in Task 8

Focus on: `src/app/layout.tsx` body classes, `src/app/page.tsx` gradient.

**Step 8: Verify build passes**

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors, build succeeds

**Step 9: Commit**

```bash
git add src/components/providers.tsx src/components/layout/header.tsx src/app/layout.tsx tailwind.config.ts
git commit -m "feat: add dark mode / light mode with next-themes"
```

---

### Task 10: Add streaming chat responses

**Why:** The chat endpoint waits for the full AI response before returning anything. With Claude/GPT-4, this can be 10-30 seconds of blank UI. Streaming tokens as they arrive dramatically improves perceived responsiveness.

**Files:**
- Modify: `src/app/api/chat/route.ts` — return a streaming `Response`
- Modify: `src/app/workspace/[experimentId]/page.tsx` — consume the stream

**Step 1: Read the full chat route**

```bash
cat src/app/api/chat/route.ts
```

**Step 2: Rewrite chat route to stream**

Replace the entire `src/app/api/chat/route.ts` with:

```typescript
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPTS, getMLProblemContext } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, problemType, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let systemPrompt = SYSTEM_PROMPTS.general;
    if (problemType) systemPrompt += "\n\n" + getMLProblemContext(problemType);
    if (context) systemPrompt += "\n\nAdditional Context:\n" + context;

    const provider = (process.env.AI_PROVIDER as string) || "claude";

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (provider === "claude") {
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const conversationMessages = messages.filter((m: any) => m.role !== "system");

            const anthropicStream = anthropic.messages.stream({
              model: "claude-opus-4-6",
              max_tokens: 2000,
              system: systemPrompt,
              messages: conversationMessages.map((m: any) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
              })),
            });

            for await (const chunk of anthropicStream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                controller.enqueue(new TextEncoder().encode(chunk.delta.text));
              }
            }
          } else if (provider === "openai") {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const openaiStream = await openai.chat.completions.create({
              model: "gpt-4-turbo-preview",
              messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content })),
              ],
              stream: true,
            });

            for await (const chunk of openaiStream) {
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) controller.enqueue(new TextEncoder().encode(text));
            }
          } else {
            // Gemini doesn't support streaming easily via current SDK — fall back to full response
            const { chat } = await import("@/lib/ai/providers");
            const response = await chat(
              [{ role: "system", content: systemPrompt }, ...messages],
              provider as any
            );
            controller.enqueue(new TextEncoder().encode(response.content));
          }
        } catch (err: any) {
          controller.enqueue(
            new TextEncoder().encode(`\n\nError: ${err.message}`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

**Step 3: Update the workspace to consume the stream**

In `src/app/workspace/[experimentId]/page.tsx`, replace `handleSendMessage` (around line 111):

```typescript
const handleSendMessage = async () => {
  if (!inputValue.trim() || loading) return;

  const userMessage = inputValue;
  setInputValue("");
  setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
  setLoading(true);

  // Add empty assistant message that we'll stream into
  setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: userMessage }],
        problemType: experiment?.problemType,
        context: `Experiment: ${experiment?.name}`,
      }),
    });

    if (!response.ok || !response.body) throw new Error("Failed to get response");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: updated[updated.length - 1].content + chunk,
        };
        return updated;
      });
    }
  } catch (error: any) {
    console.error("Chat error:", error);
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        role: "assistant",
        content: `Error: ${error.message}. Please try again.`,
      };
      return updated;
    });
  } finally {
    setLoading(false);
  }
};
```

**Step 4: Remove the loading bounce dots** (streaming shows text immediately so they're not needed)

The `{loading && <div className="flex justify-start">...bounce...</div>}` block can stay — it will show briefly before the first token arrives, which is fine.

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors

**Step 6: Commit**

```bash
git add src/app/api/chat/route.ts "src/app/workspace/[experimentId]/page.tsx"
git commit -m "feat: stream chat responses token-by-token for better UX"
```

---

## Final Verification

**Step 1: Run full build**

```bash
npm run build 2>&1 | tail -30
```

Expected: successful build, no TypeScript errors

**Step 2: Spot-check all 9 sample CSV files**

```bash
ls public/sample-data/ | wc -l
```

Expected: `9`

**Step 3: Verify drizzle-kit works**

```bash
npm run db:generate -- --help 2>&1 | head -3
```

Expected: prints usage, no error

**Step 4: Update Status.md**

Create or update `Status.md` in the project root:

```markdown
# ML Pathways — Status

**Last updated:** 2026-04-07

## Completed Features
- [x] Core workspace (chat, code generation, execution, EDA)
- [x] Authentication (email/password, OAuth)
- [x] Multi-provider AI (Claude, OpenAI, Gemini)
- [x] E2B sandboxed code execution
- [x] Dataset upload
- [x] Experiment tracking (DB)

## Recently Implemented (2026-04-07)
- [x] All 9 sample CSV files available in public/
- [x] Delete experiments and datasets
- [x] Editable code in workspace
- [x] Mobile navigation hamburger menu
- [x] Dark mode / light mode (next-themes)
- [x] Streaming chat responses
- [x] Visualizations persisted across sessions
- [x] Datasets page shows all 9 ML problem sample datasets

## Known Issues
- Gemini streaming not supported (falls back to full response)
- `sampleDatasets` DB table defined but not seeded (sample data served from public/ instead)

## TODO
- [ ] User profile page
- [ ] Experiment comparison view
- [ ] Model hyperparameter tuning UI
- [ ] Export results as PDF report
```

**Step 5: Final commit**

```bash
git add Status.md
git commit -m "docs: update Status.md with completed features"
```

---

## Execution Order Summary

| # | Task | Effort | Deps |
|---|------|--------|------|
| 1 | npm install + copy CSV files | 2 min | none |
| 2 | DELETE /api/experiments/[id] | 5 min | none |
| 3 | DELETE /api/datasets/[id] | 5 min | none |
| 4 | Persist visualizations | 10 min | none |
| 5 | Fix datasets page | 10 min | Task 1 (CSV files) |
| 6 | Delete UI (experiments + datasets) | 10 min | Tasks 2+3 |
| 7 | Editable code editor | 10 min | none |
| 8 | Mobile nav | 10 min | none |
| 9 | Dark mode | 15 min | Task 8 (header) |
| 10 | Streaming chat | 20 min | none |

Tasks 1–4 and 7–8 are fully independent and can run in parallel.
