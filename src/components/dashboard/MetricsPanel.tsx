import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type {
  CombinedSpamAnalysis,
  FullAnalysis,
  ReadabilityAnalysis,
} from "@/lib/textAnalysis";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  MailWarning,
  Sparkles,
  Wand2,
} from "lucide-react";

interface MetricsPanelProps {
  bodyAnalysis: FullAnalysis;
  subjectSpam: CombinedSpamAnalysis["subject"];
  combinedSpam: CombinedSpamAnalysis;
  onFixWithAi?: () => void;
}

function gradeTone(grade: number): "good" | "warn" | "bad" | "info" {
  if (grade <= 8) return "good";
  if (grade <= 12) return "info";
  if (grade <= 16) return "warn";
  return "bad";
}

function ScoreMeter({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "good" | "warn" | "bad" | "accent" | "info";
}) {
  const bar: Record<typeof tone, string> = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-rose-500",
    accent: "bg-teal-500",
    info: "bg-sky-500",
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tabular-nums font-semibold text-slate-900">
          {value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={`h-full rounded-full ${bar[tone]}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

function ReadabilityCard({ readability }: { readability: ReadabilityAnalysis }) {
  return (
    <Card
      title="Readability"
      subtitle="Hemingway-style grade & sentence flags"
      action={
        <Badge tone={gradeTone(readability.fleschKincaidGrade)}>
          Grade {readability.fleschKincaidGrade.toFixed(1)}
        </Badge>
      }
    >
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Words" value={readability.wordCount} />
        <Stat label="Sentences" value={readability.sentenceCount} />
        <Stat label="Hard" value={readability.hardSentences.length} warn />
        <Stat
          label="Very hard"
          value={readability.veryHardSentences.length}
          bad
        />
        <Stat label="Adverbs" value={readability.adverbs.length} info />
        <Stat label="Passive" value={readability.passiveVoice.length} accent />
      </div>
      {readability.simplerAlternatives.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Simpler swaps
          </p>
          <ul className="max-h-28 space-y-1.5 overflow-auto text-sm">
            {readability.simplerAlternatives.slice(0, 6).map((s, i) => (
              <li
                key={`${s.start}-${i}`}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate text-slate-600">{s.original}</span>
                <span className="shrink-0 font-medium text-teal-700">
                  → {s.suggestion || "∅"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

function Stat({
  label,
  value,
  warn,
  bad,
  info,
  accent,
}: {
  label: string;
  value: number;
  warn?: boolean;
  bad?: boolean;
  info?: boolean;
  accent?: boolean;
}) {
  const colour = bad
    ? "text-rose-700"
    : warn
      ? "text-amber-700"
      : info
        ? "text-sky-700"
        : accent
          ? "text-violet-700"
          : "text-slate-900";
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`text-lg font-semibold tabular-nums ${colour}`}>{value}</p>
    </div>
  );
}

export function MetricsPanel({
  bodyAnalysis,
  subjectSpam,
  combinedSpam,
  onFixWithAi,
}: MetricsPanelProps) {
  const { readability, aiDetectionScore } = bodyAnalysis;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto pb-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          type="button"
          onClick={onFixWithAi}
          disabled
          title="Claude rewrite arrives in a later prompt"
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Wand2 className="h-4 w-4 text-teal-300 transition group-hover:rotate-12" />
          Fix with AI
          <Badge tone="accent" className="ml-1 bg-teal-400/20 text-teal-200 ring-teal-400/30">
            Soon
          </Badge>
        </button>
      </motion.div>

      <ReadabilityCard readability={readability} />

      <Card
        title="Spam / deliverability"
        subtitle="Subject + body risk combined"
        action={
          <Badge
            tone={
              combinedSpam.risk === "High"
                ? "bad"
                : combinedSpam.risk === "Medium"
                  ? "warn"
                  : "good"
            }
          >
            {combinedSpam.risk}
          </Badge>
        }
      >
        <div className="space-y-3">
          <ScoreMeter
            value={combinedSpam.score}
            label="Risk density"
            tone={
              combinedSpam.risk === "High"
                ? "bad"
                : combinedSpam.risk === "Medium"
                  ? "warn"
                  : "good"
            }
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                <MailWarning className="h-3 w-3" /> Subject
              </div>
              <p className="font-semibold text-slate-900">
                {subjectSpam.risk}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  · {subjectSpam.triggerCount} hits
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                <AlertTriangle className="h-3 w-3" /> Body
              </div>
              <p className="font-semibold text-slate-900">
                {combinedSpam.body.risk}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  · {combinedSpam.body.triggerCount} hits
                </span>
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Caps shouting or !! / ?! runs force High regardless of density.
          </p>
        </div>
      </Card>

      <Card
        title="AI detection (mock)"
        subtitle="Deterministic heuristic — not a real classifier"
        action={
          <Badge tone={aiDetectionScore >= 60 ? "warn" : "good"}>
            {aiDetectionScore}%
          </Badge>
        }
      >
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-teal-300">
            <Bot className="h-4 w-4" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Scores rise with uniform sentence length, formal diction, and wordy
            phrasing. Useful for UI wiring until a real model is plugged in.
          </p>
        </div>
        <ScoreMeter
          value={aiDetectionScore}
          label="AI-likeness"
          tone={aiDetectionScore >= 60 ? "warn" : "accent"}
        />
      </Card>

      <Card title="Live engine" subtitle="Pure sync functions — no network">
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-600" />
            Flesch-Kincaid + hard-sentence flags
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            Adverbs, passive voice, simpler swaps
          </li>
          <li className="flex items-center gap-2">
            <MailWarning className="h-4 w-4 text-teal-600" />
            ~150 spam triggers, caps & punctuation
          </li>
        </ul>
      </Card>
    </div>
  );
}
