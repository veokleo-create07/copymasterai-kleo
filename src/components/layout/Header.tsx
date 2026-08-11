"use client";

import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";

interface HeaderProps {
  wordCount: number;
  risk: string;
}

export function Header({ wordCount, risk }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/70 px-6 py-4 backdrop-blur-md">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Email copy lab
        </motion.h1>
        <p className="text-sm text-slate-500">
          Paste a subject and body — readability, spam risk, and AI-likeness
          update as you type.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone="neutral">{wordCount} words</Badge>
        <Badge
          tone={
            risk === "High" ? "bad" : risk === "Medium" ? "warn" : "good"
          }
        >
          Spam {risk}
        </Badge>
      </div>
    </header>
  );
}
