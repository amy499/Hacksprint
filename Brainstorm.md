# Codebase Audit — exe.ai / iNTUition.exe

Date: 2026-07-18
Scope: full repo at `HackSprint/`

## 1. Tech Stack (from package.json, not the README)

This is a **frontend-only** [Vite](https://vitejs.dev) + React + TypeScript project, originally scaffolded by **bolt.new** (see `.bolt/config.json` → `"template": "bolt-vite-react-ts"`, and `.bolt/prompt`, which contains bolt.new's standard system prompt about using Tailwind/Lucide/Unsplash).

**Dependencies** ([package.json](package.json)):
- `react` 18.3, `react-dom` 18.3, `react-router-dom` 7.4
- `framer-motion` 12.5 (all the animated transitions)
- `lucide-react` 0.344 (icon set)

**Dev dependencies**: `vite`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint` + plugins.

There is **no backend**, **no server dependency** (no Express/Fastify/Nest, no `server/` directory), **no database client**, **no HTTP client library** (no `axios`, no custom `fetch` wrapper), **no LLM SDK** (`openai`, `@anthropic-ai/sdk`, etc. are absent), and **no Puppeteer**. `npm ls` would show exactly the 3 runtime deps above.

No `requirements.txt`, no `Pipfile`, no `Cargo.toml`, no `go.mod` — this is a pure JS/TS repo, single package.

## 2. Architecture

Entry point: [index.html](index.html) → [src/main.tsx](src/main.tsx) → [src/App.tsx](src/App.tsx), which sets up `react-router-dom` routes:

```
/                           → HomePage.tsx
/new                        → PromptPage.tsx
/backend-frontend-overview  → BackendFrontendOverview.jsx
/evaluation-results         → EvaluationResult.jsx
/visualization              → VisualizationPage.tsx
/suggester                  → Suggester.tsx
```

There is no `/frontend` and `/backend` split at the project level — "frontend/backend" only exist as **in-app concepts being simulated on a single page** (see §3). The whole thing is one SPA.

**Folder layout:**
- `src/pages/` — one component per route (mix of `.tsx` and `.jsx`, inconsistently)
- `src/components/` — `Button`, `Card`, `Footer`, `Logo`, `ThemeToggle` (real, used UI atoms), plus `Modal.jsx` / `EvaluateModal.jsx` (the modal that drives the fake "evaluation" animation)
- `src/context/ThemeContext.tsx` — light/dark theme provider, actually used throughout
- `src/agents/` — a self-contained, **fully disconnected** module (see §4) — not imported by any page or by `App.tsx`
- `src/videos/` — 6 static `.mp4`/`.mov` files used as decorative "frontend preview" clips (not dynamically generated)

**Build/deploy pipeline**: none. `package.json` scripts are just the Vite defaults (`dev`, `build`, `lint`, `preview`). No CI config (no `.github/` directory), no Dockerfile, no `netlify.toml`, no Kubernetes manifests, no `.env` files anywhere in the repo.

## 3. README Claims vs. Actual Code

| README Claim | Status | Evidence |
|---|---|---|
| Generates ~10 backend variants + 50 frontend variants (500 combos) from a prompt | **Not built.** Hardcoded to 3 backend cards + 5 frontend cards | [BackendFrontendOverview.jsx:115-143](src/pages/BackendFrontendOverview.jsx#L115-L143) — `backendCards` and `frontendVideos` are static arrays of 3 and 5 items respectively. `PromptPage.tsx` never sends the user's idea anywhere; `onNext(idea)` just stores it in React state and after a hardcoded 2s `setTimeout` navigates to the overview page ([PromptPage.tsx:39-51](src/pages/PromptPage.tsx#L39-L51)) |
| Puppeteer-based persona simulation across 20 metrics | **Not built — pure UI animation.** No `puppeteer` dependency exists at all. `EvaluateModal.jsx` lists 20 real-sounding metric names (response time, throughput, color contrast, etc.) but "evaluates" them via a `setInterval` that ticks through the list every 300ms with a `Math.random()` fake combination counter | [EvaluateModal.jsx:32-175](src/components/EvaluateModal.jsx#L32-L175) (metric list), [EvaluateModal.jsx:307-342](src/components/EvaluateModal.jsx#L307-L342) (`startProcessing` — no network/process calls, just timers) |
| Scores and ranks combinations based on real-world simulation | **Not built.** `EvaluationResult.jsx` ships 15 hardcoded result objects with hand-picked scores (96.9, 94.2, ...) and canned prose analysis strings, sorted client-side by score | [EvaluationResult.jsx:8-129](src/pages/EvaluationResult.jsx#L8-L129) |
| Automatic deployment to Netlify / Kubernetes | **Not built at all**, not even mocked. No deploy button, no Netlify API call, no Docker/K8s config anywhere in the repo |
| Suggestion module analyzing site performance + online trends | **Not built — static mock list.** `Suggester.tsx` (exported as `SuggestorPage`) ships a hardcoded array of 10 suggestions ("Switch to AWS", "Add trending YouTube product section" — literally the README's own example text, verbatim). "Generate New Ideas" just re-shuffles the same 10 items client-side with `Math.random()` | [Suggester.tsx:16-87](src/pages/Suggester.tsx#L16-L87) (data), [Suggester.tsx:129-137](src/pages/Suggester.tsx#L129-L137) (`handleRefresh` — array shuffle, no fetch) |
| Persona-driven "Performance Score" visualization | **Not built.** `VisualizationPage.tsx` plays a static video (`Frontend_6.mp4`) next to a terminal panel that types out a scripted array of fake log lines (`terminalData`) with random delays, ending in a hardcoded score of `0.96` / "EXCEPTIONAL" | [VisualizationPage.tsx:8-32](src/pages/VisualizationPage.tsx#L8-L32) (scripted log lines), [VisualizationPage.tsx:163-177](src/pages/VisualizationPage.tsx#L163-L177) (hardcoded "0.96" score) |

**Summary: every backend claim in the README is currently pure frontend theater** — animated loading states, timers, and hardcoded/randomized mock data. There is no code path anywhere that takes the user's prompt and does anything with it besides storing it in unused React state.

## 4. Existing AI/LLM Integration

There is an `src/agents/` module (`AgentController`, `AgentLLM`, `AgentAPI`, `AgentTools`, `AgentMemory`, `AgentPlanner`, `AgentPrompts`, `AgentObserver`, `AgentUtils`, ~1000 lines total) that **looks** like real agent infrastructure, but every method is an explicit placeholder:

- `AgentLLM.complete()` returns a hardcoded string `"This is a placeholder response for: ..."` — no HTTP call, no API key usage, no provider SDK ([AgentLLM.ts:24-36](src/agents/AgentLLM.ts#L24-L36))
- `AgentAPI.callAPI()` hits no real endpoint; it `setTimeout`s 500ms and returns switch-cased fake JSON for `search`/`knowledge`/`image_generation` against `https://api.example.com/...` placeholder URLs ([AgentAPI.ts:33-102](src/agents/AgentAPI.ts#L33-L102))
- `AgentTools` registers `web_search`, `code_execution`, `file_operations` tools that each just `console.log` and resolve canned objects

**Critically, this whole module is dead code** — grep confirms only `src/agents/index.ts` and `AgentController.ts` reference `AgentController`/`createAgent`, and nothing in `App.tsx` or any page imports from `src/agents` at all. It's scaffolding for a future agent system that was never wired into the UI.

**No provider is referenced anywhere** — no OpenAI, Anthropic, Google, or any other AI API key, SDK import, or fetch call exists in the codebase (confirmed via grep for `fetch(`, `axios`, `process.env`, `import.meta.env`, `API_KEY`, `openai`, `anthropic` — zero matches outside placeholder strings).

## 5. Existing Scraping / Data-Fetching

None. No scraping library (`cheerio`, `puppeteer`, `playwright`), no trend-fetching code, no external API calls of any kind. The "online trends" suggestion feature described in the README is a static array in `Suggester.tsx`.

## 6. Deployment

**Purely aspirational.** There is:
- No `netlify.toml` / Netlify config
- No `Dockerfile` or container config
- No Kubernetes manifests
- No CI/CD (no `.github/workflows`)
- No `.env` or `.env.example` file
- `vite.config.ts` is the unmodified Vite+React default — no build target, no proxy, no server config

Running this project today means `npm run dev` locally; there is no path to production deployment built in yet.

## 7. Known Issues / Loose Ends

- **`ScorePage.tsx` is an empty file** ([src/pages/ScorePage.tsx](src/pages/ScorePage.tsx)) — 0 bytes, not imported anywhere, dead file.
- **`src/agents/` is entirely unused** — ~1000 lines of placeholder agent scaffolding not wired into the app; either finish it or remove it before extending, since it will confuse anyone grepping for "where does the LLM call happen."
- **Inconsistent file extensions**: some pages are `.tsx` (typed), others `.jsx` (untyped) — `BackendFrontendOverview.jsx`, `EvaluationResult.jsx`, `Suggester.tsx` is actually `.tsx` but exports both a named `SuggestorPage` and default `Suggester` inconsistently with the route import (`App.tsx` imports default `Suggester`, file defines `SuggestorPage` as the named export and also default-exports it — works, but the naming is confusing).
- **`// @ts-ignore` used to suppress type errors on imports** in [App.tsx:5,7](src/App.tsx#L5) and [PromptPage.tsx:9](src/pages/PromptPage.tsx#L9) — masking the `.jsx` files' lack of type declarations rather than fixing it.
- **File upload UI is non-functional**: `PromptPage.tsx`'s `handleFileChange` only `console.log`s the selected files ([PromptPage.tsx:92-96](src/pages/PromptPage.tsx#L92-L96)) — no actual upload/processing.
- **"Download results" button is explicitly a demo stub**: `EvaluationResult.jsx`'s `handleDownload` just shows `alert("Download started! (This is just a demo)")` ([EvaluationResult.jsx:166-170](src/pages/EvaluationResult.jsx#L166-L170)).
- **Hardcoded video paths** (`/src/videos/Frontend_1.mp4` etc.) reference source-tree paths directly rather than a public assets folder — this happens to work under Vite dev but is fragile for production builds/deploys.
- **No environment variable usage at all**, so there's nothing to misconfigure yet — but also nothing set up for when real API keys (LLM provider, deployment tokens) are needed.
- **No tests** of any kind (no test runner configured, no `*.test.*`/`*.spec.*` files).

## Bottom Line

This repo is a **polished UI prototype / demo shell** for the exe.ai concept — every "AI-powered," "simulation-based," or "automated" claim in the README is currently a timed animation over static/mocked data. The actual prompt-to-code generation, persona simulation, scoring, suggestion, and deployment pipeline described in the README **does not exist yet** in any form (not even a stub API route) except for the disconnected `src/agents/` placeholder module, which itself contains no real model or API integration. Extending this into the real product means building the entire backend (codegen, evaluation, scoring, deployment) from scratch; the current codebase's value is the working React shell, routing, theming, and UI/UX flow that a real backend can be wired into.
