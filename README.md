# bpmn-forge-playground

A minimal Next.js (App Router) playground for [@macrix-technology-group/bpmn-forge](https://github.com/Macrix-Technology-Group/bpmn-forge):

- a textbox for a process description
- a **Generate SVG** button
- an inline SVG viewer + download

The page POSTs the prompt to `/api/generate`, which calls `textToIrWithLlm` then `renderUnifiedSvg` server-side and returns the SVG.

## Running locally

```bash
cp .env.local.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY

npm run dev
# open http://localhost:3000
```

## Stack

- Next.js (App Router, Turbopack)
- TypeScript
- `@macrix-technology-group/bpmn-forge` installed via git URL pinned to a release tag

## Files of interest

- [`app/page.tsx`](app/page.tsx) — client UI (prompt textarea, generate button, SVG viewer).
- [`app/api/generate/route.ts`](app/api/generate/route.ts) — server route that runs bpmn-forge.
- [`.env.local.example`](.env.local.example) — Anthropic API key.

## Updating bpmn-forge

```bash
npm install "git+https://github.com/Macrix-Technology-Group/bpmn-forge.git#<new-tag>"
```
