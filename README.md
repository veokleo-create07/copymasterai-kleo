# CopyMaster

Email copywriting testing dashboard (Vite + React SPA). Paste a subject + body
and get instant local feedback: Hemingway-style readability, spam risk, and a
mock AI-detection score.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Framer Motion + lucide-react
- Pure sync analysis in `src/lib/textAnalysis.ts`

## Develop

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm test
npm run build   # outputs to /dist
```

## Vercel

Root app. `vercel.json` sets:
- `framework`: `vite`
- `outputDirectory`: `dist`
- SPA rewrite: all routes → `/index.html`

Dashboard settings (if overrides exist):
- Root Directory: blank / `.`
- Framework: Vite
- Output Directory: `dist` (or leave default)
- Do not set Next.js as the framework
