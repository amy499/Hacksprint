# Project Context

This is a hackathon project for the Daytona HackSprint (Singapore, July 2026),
a one-day event judged on: Completeness (working MVP), Innovation,
Real-Life Problem Solving, and Sponsored Product Usage.

- Time budget: ~5 hacking hours total (11:30 AM - 4:30 PM), live 2-minute demo
  at the end of the day
- Must visibly integrate 6 sponsor products, each doing a distinct, non-redundant
  job (see Architecture below) — judges from ai& and Doubleword will personally
  be in the room, so their integrations need to be real and legible in the demo,
  not just name-dropped
- Priority: a working end-to-end demo beats a more "complete" but partially-broken
  system. When in doubt, favor simple/demoable over robust/production-grade.
- This codebase originated from a prior hackathon project (exe.ai / iNTUition.exe),
  now stripped of its original git history and being substantially extended under
  a new repo. Do not reference the original repo, author names, or the original
  Canva slides link anywhere in code, comments, or docs.
- Kimi API is self-funded (no event credits provided for it) and hit a billing
  block (account suspended, insufficient balance) during build. Decision: switch
  primary code generation to ai& (fully event-funded, no new integration risk).
  Kimi is now optional/stretch only — reintroduce later just for the suggestion
  step if there's time and the account gets topped up, to restore a fully
  distinct 6-sponsor story. Do not block the critical path on Kimi.

## The Idea

exe.ai: give it one prompt (e.g. "I want to build a merch website"), and it
generates several different full-stack website variants, actually tests each one
the way a real visitor would, scores them, picks the best one, and suggests a
concrete improvement grounded in real current trend data.

## Architecture — current (ai& primary, Kimi optional stretch)

1. **ai&** (OpenAI-compatible API, base URL from docs.aiand.com) — PRIMARY:
   generates the site variants (frontend + backend code for each combination).
   ALSO: takes scraped trend data from Oxylabs and reasons over it to produce
   improvement suggestions. Two distinct calls/tasks, same provider, since
   Kimi is currently out of the critical path.
2. **Daytona** — runs each generated variant in its own isolated sandbox to
   actually test it live (install deps, start dev server, serve a preview).
   This is the safety/execution layer.
3. **Oxylabs** — scrapes real trend data (e.g. trending product features,
   competitor sites) relevant to the user's prompt.
4. **Doubleword** — self-hosts an open evaluation/scoring model that runs a
   persona-style check against each variant (does it load, is it usable,
   basic quality signals).
5. **Nosana** — supplies the GPU compute that the Doubleword-hosted model
   actually runs on.
6. **Kimi K2.5** (Moonshot API) — OPTIONAL STRETCH ONLY. If time and a funded
   account allow, reintroduce specifically for the suggestion-reasoning step
   (currently done by ai&) to restore a fully distinct 6-sponsor story. Do not
   block on this.

Narrative for the demo: ai& builds it and tells you what to improve and why,
Daytona runs it safely, Oxylabs grounds the suggestions in real data,
Doubleword and Nosana score how good each variant actually is.

## Scoped MVP (not the original README's 500-combination version)

- 2 backend x 2 frontend = 4 variants max
- 4-5 scoring signals, not 20 (e.g. loads without console errors, load time,
  key elements present, one persona-style pass/fail check)
- One trend source via Oxylabs, not many
- Single preview URL per top candidate is enough — no need for full
  Netlify + Kubernetes deployment pipeline for the demo

## Build order

1. Walking skeleton first: one hardcoded prompt -> Kimi generates ONE variant ->
   Daytona sandbox runs it -> confirm it's viewable. Get this fully working
   before adding scale.
2. Multiply to the 4-variant grid.
3. Add Doubleword/Nosana scoring per variant, rank them.
4. Add Oxylabs scrape -> ai& suggestion step.
5. Polish a minimal dashboard showing variants, scores, winner, suggestion.
6. Buffer time for bug fixes and a rehearsed demo run-through.

Cut list if behind schedule, in this order: reduce to 2 variants -> simplify
scoring to a single heuristic -> hardcode one trend example instead of live
Oxylabs scraping -> drop Nosana/Doubleword last resort only.

## Conventions

- Keep code simple and demoable over abstracted/production-grade — this is a
  hackathon build with a hard deadline.
- Ask before making sweeping structural changes to code inherited from the
  original repo; prefer additive changes where reasonable.