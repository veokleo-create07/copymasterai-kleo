"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { HighlightLegend } from "@/components/dashboard/HighlightLegend";
import { MetricsPanel } from "@/components/dashboard/MetricsPanel";
import { TextEditor } from "@/components/dashboard/TextEditor";
import {
  analyzeSpam,
  analyzeText,
  buildHighlightRuns,
  combineSpamAnalyses,
} from "@/lib/textAnalysis";

const SAMPLE_SUBJECT = "ACT NOW — claim your FREE gift today!!!";
const SAMPLE_BODY = `Dear Account Holder,
We wanted to utilize this opportunity in order to inform you that your account was selected for a limited time offer.

Please click here to double your income with our risk free guarantee. This message was written carefully so that every benefit is clearly demonstrated.

Visit test-link.invalid for details. Your invoice is ready and the form is completed once you confirm.`;

export default function HomePage() {
  const [subject, setSubject] = useState(SAMPLE_SUBJECT);
  const [text, setText] = useState(SAMPLE_BODY);

  const bodyAnalysis = useMemo(() => analyzeText(text), [text]);
  const subjectSpam = useMemo(() => analyzeSpam(subject), [subject]);
  const combinedSpam = useMemo(
    () => combineSpamAnalyses(subjectSpam, bodyAnalysis.spam),
    [subjectSpam, bodyAnalysis.spam],
  );

  const subjectRuns = useMemo(
    () => buildHighlightRuns(subject, subjectSpam.ranges),
    [subject, subjectSpam.ranges],
  );
  const bodyRuns = useMemo(
    () => buildHighlightRuns(text, bodyAnalysis.ranges),
    [text, bodyAnalysis.ranges],
  );

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_#ecfdf5_0%,_#f8fafc_45%,_#eef2ff_100%)] text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          wordCount={bodyAnalysis.readability.wordCount}
          risk={combinedSpam.risk}
        />
        <main className="grid min-h-0 flex-1 gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <section className="flex min-h-0 flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm shadow-slate-900/5 backdrop-blur">
            <TextEditor
              subject={subject}
              text={text}
              subjectRuns={subjectRuns}
              bodyRuns={bodyRuns}
              onSubjectChange={setSubject}
              onTextChange={setText}
            />
            <HighlightLegend />
          </section>
          <aside className="min-h-0">
            <MetricsPanel
              bodyAnalysis={bodyAnalysis}
              subjectSpam={subjectSpam}
              combinedSpam={combinedSpam}
            />
          </aside>
        </main>
      </div>
    </div>
  );
}
