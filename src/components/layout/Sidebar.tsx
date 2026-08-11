"use client";

import { Feather, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NAV = [
  { label: "Editor", active: true },
  { label: "Drafts", active: false },
  { label: "Fix with AI", active: false },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200/80 bg-slate-950 text-slate-100">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400 text-slate-950 shadow-lg shadow-teal-400/30"
        >
          <Feather className="h-4.5 w-4.5" strokeWidth={2.25} />
        </motion.div>
        <div>
          <p className="text-[15px] font-semibold tracking-tight">CopyMaster</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Copy lab
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={!item.active}
            className={`rounded-xl px-3 py-2.5 text-left text-sm transition ${
              item.active
                ? "bg-white/10 font-medium text-white"
                : "cursor-not-allowed text-slate-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-teal-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Coming soon
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          Claude rewrite + draft sync land in the next prompts. Analysis stays
          local and instant.
        </p>
      </div>
    </aside>
  );
}
