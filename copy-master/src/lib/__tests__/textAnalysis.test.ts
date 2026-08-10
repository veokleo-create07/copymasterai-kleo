import { describe, expect, it } from "vitest";
import {
  analyzeSpam,
  analyzeText,
  buildHighlightRuns,
  combineSpamAnalyses,
  countSyllables,
  findPassiveVoice,
  findSimplerAlternatives,
  fleschKincaidGrade,
  splitSentences,
  tokenizeWords,
} from "../textAnalysis";

describe("tokenizeWords", () => {
  it("matches simple words with apostrophes and hyphens", () => {
    const words = tokenizeWords("Don't re-use customer's links");
    expect(words.map((w) => w.text)).toEqual([
      "Don't",
      "re-use",
      "customer's",
      "links",
    ]);
  });
});

describe("splitSentences", () => {
  it("does not split on periods inside URLs/hostnames", () => {
    const text =
      "Please visit test-link.invalid for details about your account today.";
    const sentences = splitSentences(text);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]?.text).toContain("test-link.invalid");
  });

  it("treats a greeting on its own line as its own sentence", () => {
    const text = "Dear Account Holder,\nYour invoice is ready.";
    const sentences = splitSentences(text);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences[0]?.text).toBe("Dear Account Holder,");
    expect(sentences[1]?.text).toMatch(/Your invoice is ready/);
  });

  it("splits on terminal punctuation followed by whitespace", () => {
    const text = "Hello there. How are you? Fine!";
    const sentences = splitSentences(text);
    expect(sentences.map((s) => s.text)).toEqual([
      "Hello there.",
      "How are you?",
      "Fine!",
    ]);
  });

  it("keeps abbreviations-like tokens without trailing space intact in one sentence", () => {
    const text = "See docs at api.example.com/v1 now";
    expect(splitSentences(text)).toHaveLength(1);
  });
});

describe("syllables and grade", () => {
  it("counts syllables with a vowel-group heuristic", () => {
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("reading")).toBeGreaterThanOrEqual(2);
    expect(countSyllables("beautiful")).toBeGreaterThanOrEqual(3);
  });

  it("computes Flesch-Kincaid grade", () => {
    const grade = fleschKincaidGrade(100, 10, 150);
    expect(grade).toBe(6);
  });
});

describe("passive voice", () => {
  it("detects auxiliary + past participle including irregulars", () => {
    const ranges = findPassiveVoice("The ball was thrown across the field.");
    expect(ranges.length).toBeGreaterThanOrEqual(1);
    expect(ranges[0]?.type).toBe("passive");
  });

  it("detects -ed participles", () => {
    const ranges = findPassiveVoice("The form is completed by the user.");
    expect(ranges.length).toBeGreaterThanOrEqual(1);
  });
});

describe("simpler alternatives", () => {
  it("prefers longest phrase match", () => {
    const matches = findSimplerAlternatives(
      "We will utilize this in order to win.",
    );
    const phrases = matches.map((m) => m.original.toLowerCase());
    expect(phrases).toContain("in order to");
    expect(phrases).toContain("utilize");
  });
});

describe("spam analysis", () => {
  it("flags known spam phrases and forces High on shouting", () => {
    const analysis = analyzeSpam(
      "ACT NOW AND DOUBLE YOUR INCOME!!! Click here for free money.",
    );
    expect(analysis.triggerCount).toBeGreaterThan(0);
    expect(analysis.risk).toBe("High");
    expect(analysis.excessivePunctuationCount).toBeGreaterThan(0);
  });

  it("combineSpamAnalyses merges subject and body", () => {
    const subject = analyzeSpam("FREE MONEY");
    const body = analyzeSpam("Hello friend, your invoice is attached.");
    const combined = combineSpamAnalyses(subject, body);
    expect(combined.totalTriggers).toBe(
      subject.triggerCount + body.triggerCount,
    );
    expect(["Low", "Medium", "High"]).toContain(combined.risk);
  });
});

describe("buildHighlightRuns", () => {
  it("produces contiguous runs covering the full text", () => {
    const text = "Please utilize this carefully.";
    const analysis = analyzeText(text);
    const runs = buildHighlightRuns(text, analysis.ranges);
    expect(runs.map((r) => r.text).join("")).toBe(text);
  });
});

describe("analyzeText", () => {
  it("returns readability, spam, and mock AI score", () => {
    const result = analyzeText(
      "Dear Account Holder,\nPlease utilize our platform in order to get started today.",
    );
    expect(result.readability.wordCount).toBeGreaterThan(0);
    expect(result.aiDetectionScore).toBeGreaterThanOrEqual(0);
    expect(result.aiDetectionScore).toBeLessThanOrEqual(100);
  });
});
