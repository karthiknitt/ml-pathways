# ML Pathways — Project Status

**Last updated:** 2026-04-07

## Completed Features

### Core Platform
- [x] Authentication (email/password, OAuth GitHub/Google via BetterAuth)
- [x] Multi-provider AI (Claude Opus 4.6, OpenAI GPT-4, Gemini) with streaming chat
- [x] E2B sandboxed Python code execution
- [x] Exploratory Data Analysis (EDA) with AI-generated summaries
- [x] Dataset upload (CSV, up to 10MB)
- [x] Experiment tracking (DB persistence of code, output, visualizations)
- [x] 9 ML problem types (linear/multiple/polynomial/regularized regression, logistic, multiclass, neural networks, k-means, PCA)
- [x] All 9 sample datasets available in public/sample-data/

### UX / UI
- [x] Dark mode / light mode (next-themes, system default, toggle in nav)
- [x] Mobile responsive navigation with hamburger menu
- [x] Streaming chat responses (token-by-token, no waiting)
- [x] Editable generated code before execution (Edit Code / Preview toggle)
- [x] Visualizations (charts) persisted and restored across page refreshes
- [x] Delete experiments (with ownership check)
- [x] Delete datasets (with ownership check)
- [x] Datasets page shows all 9 ML problem sample datasets with correct links

### Data / API
- [x] DELETE /api/experiments/[id] — with auth + ownership guard
- [x] DELETE /api/datasets/[id] — with auth + ownership guard

## Known Limitations

- Gemini streaming not supported — falls back to full response (SDK limitation)
- `sampleDatasets` DB table defined in schema but not seeded — sample data served from public/ directly
- Modal overlays (Data Summary, EDA Report) use div-based overlays, not ShadCN Dialog (no Escape key / focus trap)
- Message list uses index as React key — may cause minor flicker during streaming on re-renders
- `alert()` used in workspace for copy/export confirmations — should migrate to ShadCN toast

## TODO (Future)

- [ ] User profile / account settings page
- [ ] Experiment comparison view (side-by-side metrics)
- [ ] Model hyperparameter tuning UI
- [ ] Export results as PDF report
- [ ] Migrate workspace modals to ShadCN Dialog component
- [ ] Gemini streaming support
- [ ] Seed `sampleDatasets` DB table from public CSV files
