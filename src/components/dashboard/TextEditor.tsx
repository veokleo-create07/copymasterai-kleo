import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type UIEvent,
} from "react";
import type { HighlightRun, HighlightType } from "@/lib/textAnalysis";

interface TextEditorProps {
  subject: string;
  text: string;
  subjectRuns: HighlightRun[];
  bodyRuns: HighlightRun[];
  onSubjectChange: (value: string) => void;
  onTextChange: (value: string) => void;
}

const EDITOR_FONT: CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: "14px",
  lineHeight: "1.65",
  letterSpacing: "0",
};

function runClassName(types: HighlightType[]): string {
  const classes: string[] = ["rounded-[3px]"];

  // Sentence-level shading sits behind word-level colours
  if (types.includes("very-hard")) {
    classes.push("bg-rose-200/55 box-decoration-clone");
  } else if (types.includes("hard")) {
    classes.push("bg-amber-200/55 box-decoration-clone");
  }

  // Word-level backgrounds win when present
  if (types.includes("adverb")) {
    classes.push("bg-sky-300/70");
  } else if (types.includes("passive")) {
    classes.push("bg-violet-300/70");
  } else if (types.includes("simpler")) {
    classes.push("bg-teal-300/70");
  }

  if (types.includes("spam")) {
    classes.push("underline decoration-wavy decoration-rose-500 underline-offset-2");
  }

  return classes.join(" ");
}

function HighlightLayer({
  runs,
  singleLine = false,
}: {
  runs: HighlightRun[];
  singleLine?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-slate-800 ${
        singleLine ? "overflow-x-auto whitespace-pre" : ""
      }`}
      style={{
        ...EDITOR_FONT,
        padding: singleLine ? "10px 14px" : "14px",
      }}
    >
      {runs.length === 0 ? (
        "\u00a0"
      ) : (
        runs.map((run, i) =>
          run.types.length === 0 ? (
            <span key={i}>{run.text}</span>
          ) : (
            <span key={i} className={runClassName(run.types)}>
              {run.text}
            </span>
          ),
        )
      )}
    </div>
  );
}

export function TextEditor({
  subject,
  text,
  subjectRuns,
  bodyRuns,
  onSubjectChange,
  onTextChange,
}: TextEditorProps) {
  const subjectBackdropRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyBackdropRef = useRef<HTMLDivElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const syncSubjectScroll = useCallback(() => {
    const input = subjectInputRef.current;
    const backdrop = subjectBackdropRef.current;
    if (!input || !backdrop) return;
    backdrop.scrollLeft = input.scrollLeft;
  }, []);

  const syncBodyScroll = useCallback(() => {
    const area = bodyTextareaRef.current;
    const backdrop = bodyBackdropRef.current;
    if (!area || !backdrop) return;
    backdrop.scrollTop = area.scrollTop;
    backdrop.scrollLeft = area.scrollLeft;
  }, []);

  useEffect(() => {
    syncSubjectScroll();
  }, [subject, syncSubjectScroll]);

  useEffect(() => {
    syncBodyScroll();
  }, [text, syncBodyScroll]);

  const onBodyScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const backdrop = bodyBackdropRef.current;
    if (!backdrop) return;
    backdrop.scrollTop = event.currentTarget.scrollTop;
    backdrop.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Subject
        </span>
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner shadow-slate-900/5">
          <div ref={subjectBackdropRef} className="absolute inset-0">
            <HighlightLayer runs={subjectRuns} singleLine />
          </div>
          <input
            ref={subjectInputRef}
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            onScroll={syncSubjectScroll}
            placeholder="Write a subject line…"
            className="relative z-10 w-full bg-transparent text-transparent caret-slate-900 outline-none placeholder:text-slate-400"
            style={{
              ...EDITOR_FONT,
              padding: "10px 14px",
              WebkitTextFillColor: "transparent",
            }}
            spellCheck={false}
          />
        </div>
      </label>

      <label className="flex min-h-0 flex-1 flex-col">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Body
        </span>
        <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner shadow-slate-900/5">
          <div
            ref={bodyBackdropRef}
            className="absolute inset-0 overflow-auto"
          >
            <HighlightLayer runs={bodyRuns} />
          </div>
          <textarea
            ref={bodyTextareaRef}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onScroll={onBodyScroll}
            placeholder="Paste your email body here…"
            className="relative z-10 h-full min-h-[320px] w-full resize-none bg-transparent text-transparent caret-slate-900 outline-none placeholder:text-slate-400"
            style={{
              ...EDITOR_FONT,
              padding: "14px",
              WebkitTextFillColor: "transparent",
            }}
            spellCheck={false}
          />
        </div>
      </label>
    </div>
  );
}
