# CopyMaster

Email copywriting testing dashboard. Paste a subject + body and get instant,
local feedback: Hemingway-style readability, spam/deliverability risk, and a
mock AI-detection score.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion + lucide-react
- Pure sync analysis in `src/lib/textAnalysis.ts` (no NLP libs, no network)

## Develop

```bash
cd copy-master
npm install
cp .env.local.example .env.local   # fill in later when AI/DB land
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test      # analysis unit tests
npm run build
```

## Structure

See `src/app`, `src/components`, and `src/lib/textAnalysis.ts`.
`page.tsx` owns `subject` / `text` state; children are presentational.

Secrets stay server-side — see `.env.local.example`.
