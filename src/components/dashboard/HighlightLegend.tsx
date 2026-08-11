const LEGEND = [
  { label: "Hard sentence", className: "bg-amber-200/80" },
  { label: "Very hard", className: "bg-rose-200/80" },
  { label: "Adverb", className: "bg-sky-300/80" },
  { label: "Passive voice", className: "bg-violet-300/80" },
  { label: "Simpler word", className: "bg-teal-300/80" },
  {
    label: "Spam trigger",
    className:
      "bg-transparent underline decoration-wavy decoration-rose-500 underline-offset-2",
  },
] as const;

export function HighlightLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-xs text-slate-600">
      <span className="font-semibold uppercase tracking-[0.12em] text-slate-400">
        Legend
      </span>
      {LEGEND.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block min-w-[1.75rem] rounded px-1.5 py-0.5 text-center font-medium text-slate-800 ${item.className}`}
          >
            Aa
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}
