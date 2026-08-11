/**
 * CopyMaster pure text-analysis engine.
 * All functions are synchronous, dependency-free: string in → numbers/ranges out.
 */

export type HighlightType =
  | "hard"
  | "very-hard"
  | "adverb"
  | "passive"
  | "simpler"
  | "spam";

export interface TextRange {
  start: number;
  end: number;
  type: HighlightType;
}

export interface HighlightRun {
  text: string;
  start: number;
  end: number;
  types: HighlightType[];
}

export interface SentenceInfo {
  text: string;
  start: number;
  end: number;
  wordCount: number;
}

export interface WordMatch {
  text: string;
  start: number;
  end: number;
  index: number;
}

export interface SimplerMatch extends TextRange {
  suggestion: string;
  original: string;
}

export interface ReadabilityAnalysis {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  fleschKincaidGrade: number;
  hardSentences: TextRange[];
  veryHardSentences: TextRange[];
  adverbs: TextRange[];
  passiveVoice: TextRange[];
  simplerAlternatives: SimplerMatch[];
  ranges: TextRange[];
}

export type SpamFlagType = "spam-word" | "all-caps" | "excessive-punctuation";

export interface SpamFlag {
  start: number;
  end: number;
  type: SpamFlagType;
  matched?: string;
}

export type SpamRisk = "Low" | "Medium" | "High";

export interface SpamAnalysis {
  flags: SpamFlag[];
  risk: SpamRisk;
  score: number;
  triggerCount: number;
  capsSentenceCount: number;
  excessivePunctuationCount: number;
  ranges: TextRange[];
}

export interface CombinedSpamAnalysis {
  subject: SpamAnalysis;
  body: SpamAnalysis;
  risk: SpamRisk;
  score: number;
  totalTriggers: number;
  ranges: TextRange[];
}

export interface FullAnalysis {
  readability: ReadabilityAnalysis;
  spam: SpamAnalysis;
  ranges: TextRange[];
  /** Deterministic mock AI-detection score (0–100). Higher = more "AI-like". */
  aiDetectionScore: number;
}

const WORD_RE = /[A-Za-z'-]+/g;

const ADVERB_STOPLIST = new Set(
  [
    "only",
    "reply",
    "family",
    "early",
    "supply",
    "apply",
    "multiply",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "ally",
    "belly",
    "bully",
    "chilly",
    "curly",
    "holy",
    "jelly",
    "jolly",
    "lily",
    "lonely",
    "lovely",
    "silly",
    "smelly",
    "ugly",
    "friendly",
    "elderly",
    "costly",
    "worldly",
    "timely",
    "likely",
    "unlikely",
    "fly",
    "july",
    "italy",
    "assembly",
    "butterfly",
    "monopoly",
    "anomaly",
    "homily",
    "imply",
    "comply",
    "rely",
    "sly",
    "wily",
    "gully",
    "hilly",
    "rally",
    "tally",
    "valley",
    "woolly",
  ].map((w) => w.toLowerCase()),
);

const AUXILIARIES = new Set([
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "get",
  "gets",
  "got",
  "gotten",
]);

const IRREGULAR_PARTICIPLES = new Set(
  [
    "awoken",
    "been",
    "begun",
    "bent",
    "beset",
    "bitten",
    "bled",
    "blown",
    "broken",
    "brought",
    "built",
    "bought",
    "caught",
    "chosen",
    "clung",
    "come",
    "cost",
    "crept",
    "cut",
    "dealt",
    "done",
    "drawn",
    "dreamt",
    "driven",
    "drunk",
    "eaten",
    "fallen",
    "fed",
    "felt",
    "fought",
    "found",
    "fit",
    "fled",
    "flung",
    "flown",
    "forbidden",
    "forgotten",
    "forgiven",
    "forsaken",
    "frozen",
    "gotten",
    "given",
    "gone",
    "ground",
    "grown",
    "hung",
    "heard",
    "hidden",
    "hit",
    "held",
    "hurt",
    "kept",
    "known",
    "laid",
    "led",
    "leant",
    "leapt",
    "learnt",
    "left",
    "lent",
    "let",
    "lain",
    "lit",
    "lost",
    "made",
    "meant",
    "met",
    "misspelt",
    "mistaken",
    "mown",
    "overcome",
    "overdone",
    "overtaken",
    "overthrown",
    "paid",
    "pled",
    "proven",
    "put",
    "quit",
    "read",
    "rid",
    "ridden",
    "rung",
    "risen",
    "run",
    "said",
    "seen",
    "sought",
    "sold",
    "sent",
    "set",
    "sewn",
    "shaken",
    "shaven",
    "shorn",
    "shed",
    "shone",
    "shod",
    "shot",
    "shown",
    "shrunk",
    "shut",
    "sung",
    "sunk",
    "sat",
    "slept",
    "slain",
    "slid",
    "slung",
    "slit",
    "smitten",
    "sown",
    "spoken",
    "sped",
    "spent",
    "spilt",
    "spun",
    "spit",
    "split",
    "spread",
    "sprung",
    "stood",
    "stolen",
    "stuck",
    "stung",
    "stunk",
    "stridden",
    "struck",
    "strung",
    "striven",
    "sworn",
    "swept",
    "swollen",
    "swum",
    "swung",
    "taken",
    "taught",
    "torn",
    "told",
    "thought",
    "thrived",
    "thrown",
    "thrust",
    "trodden",
    "understood",
    "upheld",
    "upset",
    "woken",
    "worn",
    "woven",
    "wed",
    "wept",
    "wound",
    "won",
    "withheld",
    "withstood",
    "wrung",
    "written",
  ].map((w) => w.toLowerCase()),
);

/** wordy phrase → plain alternative. Longest-match-wins at scan time. */
export const SIMPLER_ALTERNATIVES: Record<string, string> = {
  "in order to": "to",
  "with regard to": "about",
  "with respect to": "about",
  "in spite of": "despite",
  "in the event that": "if",
  "as a means of": "to",
  "for the purpose of": "to",
  "in the near future": "soon",
  "at this point in time": "now",
  "due to the fact that": "because",
  "in light of the fact that": "because",
  "it is important to note that": "",
  "a large number of": "many",
  "a number of": "some",
  "prior to": "before",
  "subsequent to": "after",
  "in addition to": "besides",
  "along the lines of": "like",
  "as well as": "and",
  "by means of": "by",
  "in excess of": "more than",
  "in favour of": "for",
  "in favor of": "for",
  "on account of": "because of",
  "on the basis of": "based on",
  "with the exception of": "except",
  "make use of": "use",
  "take into account": "consider",
  "come to a decision": "decide",
  "give consideration to": "consider",
  "has the ability to": "can",
  "is able to": "can",
  "is required to": "must",
  utilize: "use",
  utilization: "use",
  utilizeing: "using",
  facilitate: "help",
  commence: "start",
  terminate: "end",
  endeavor: "try",
  endeavour: "try",
  demonstrate: "show",
  indicate: "show",
  require: "need",
  assistance: "help",
  sufficient: "enough",
  approximately: "about",
  presently: "now",
  currently: "now",
  subsequently: "later",
  previously: "before",
  additionally: "also",
  furthermore: "also",
  therefore: "so",
  consequently: "so",
  nevertheless: "still",
  nonetheless: "still",
  regarding: "about",
  concerning: "about",
  pertaining: "about",
  ascertain: "find out",
  attempt: "try",
  purchase: "buy",
  obtain: "get",
  retain: "keep",
  reside: "live",
  inquire: "ask",
  enquire: "ask",
  notify: "tell",
  inform: "tell",
  individidual: "person",
  individual: "person",
  individuals: "people",
  numerous: "many",
  commenceing: "starting",
  leverage: "use",
  optimize: "improve",
  optimise: "improve",
  methodology: "method",
  functionality: "features",
};

/** ~150 spam trigger words/phrases. Longest-match-wins at scan time. */
export const SPAM_TRIGGERS: string[] = [
  "$$$",
  "£££",
  "100% free",
  "100% satisfied",
  "act now",
  "action required",
  "additional income",
  "affordable",
  "all natural",
  "all new",
  "amazing",
  "apply now",
  "as seen on",
  "avoid bankruptcy",
  "be your own boss",
  "beneficiary",
  "best price",
  "big bucks",
  "billing address",
  "billion dollars",
  "billionaire",
  "call free",
  "call now",
  "cancel at any time",
  "cannot be combined",
  "cards accepted",
  "cash bonus",
  "cashcashcash",
  "casino",
  "celebrity",
  "cents on the dollar",
  "check or money order",
  "claim now",
  "click below",
  "click here",
  "click to remove",
  "confidentiality",
  "congratulations",
  "consolidate debt",
  "credit card offers",
  "cures baldness",
  "dear friend",
  "debt free",
  "direct email",
  "direct marketing",
  "do it today",
  "don't delete",
  "double your cash",
  "double your income",
  "drastically reduced",
  "earn extra cash",
  "earn per week",
  "easy terms",
  "eliminate bad credit",
  "explode your business",
  "extra cash",
  "extra income",
  "f r e e",
  "fantastic deal",
  "fast cash",
  "financial freedom",
  "for free",
  "for instant access",
  "for only",
  "free access",
  "free consultation",
  "free dvd",
  "free gift",
  "free hosting",
  "free info",
  "free investment",
  "free membership",
  "free money",
  "free preview",
  "free quote",
  "free sample",
  "free trial",
  "free website",
  "full refund",
  "get it now",
  "get out of debt",
  "get paid",
  "get started now",
  "giveaway",
  "great offer",
  "guarantee",
  "guaranteed",
  "have you been turned down",
  "hidden assets",
  "hidden charges",
  "home based",
  "home employment",
  "human growth hormone",
  "if only it were that easy",
  "important information regarding",
  "in accordance with laws",
  "increase sales",
  "increase traffic",
  "increase your sales",
  "incredible deal",
  "information you requested",
  "instant",
  "internet marketing",
  "investment decision",
  "junk",
  "laser printer",
  "limited time",
  "loan",
  "lose weight",
  "lower interest rates",
  "lowest insurance rates",
  "lowest price",
  "luxury car",
  "make money",
  "medicine",
  "meet singles",
  "message contains",
  "million dollars",
  "miracle",
  "money back",
  "money making",
  "month trial offer",
  "more internet traffic",
  "mortgage rates",
  "multi level marketing",
  "mlm",
  "name brand",
  "new customers only",
  "nigerian",
  "no age restrictions",
  "no catch",
  "no claim forms",
  "no cost",
  "no credit check",
  "no experience",
  "no fees",
  "no gimmick",
  "no hidden costs",
  "no interest",
  "no inventory",
  "no investment",
  "no medical exams",
  "no middleman",
  "no obligation",
  "no purchase necessary",
  "no questions asked",
  "no selling",
  "no strings attached",
  "not scam",
  "not spam",
  "obligation",
  "off shore",
  "offer",
  "offer expires",
  "once in lifetime",
  "one hundred percent free",
  "one time",
  "online biz opportunity",
  "online degree",
  "online marketing",
  "online pharmacy",
  "only $",
  "opportunity",
  "opt in",
  "order now",
  "order today",
  "outstanding values",
  "passwords",
  "pennies a day",
  "please read",
  "potential earnings",
  "pre-approved",
  "print form signature",
  "print out and fax",
  "priority mail",
  "prize",
  "problem",
  "produced and sent out",
  "profits",
  "promise you",
  "pure profit",
  "rates",
  "real thing",
  "refinance",
  "remove",
  "requires initial investment",
  "reserves the right",
  "reverses aging",
  "risk free",
  "rolex",
  "round the world",
  "sales",
  "sample",
  "satisfaction",
  "save $",
  "save big money",
  "save up to",
  "score with babes",
  "search engine listings",
  "see for yourself",
  "sent in compliance",
  "serious cash",
  "serious only",
  "shopper",
  "shopping spree",
  "sign up free today",
  "social security number",
  "special promotion",
  "stainless steel",
  "stock alert",
  "stock disclaimer statement",
  "stop snoring",
  "strong buy",
  "subject to credit",
  "supplies are limited",
  "take action now",
  "talks about hidden charges",
  "talks about prizes",
  "teen",
  "terms and conditions",
  "the best rates",
  "the following form",
  "they keep your money",
  "they're just giving it away",
  "this isn't junk",
  "this isn't spam",
  "university diplomas",
  "unlimited",
  "unsecured credit",
  "unsecured debt",
  "urgent",
  "us dollars",
  "vacation",
  "vacation offers",
  "valium",
  "viagra",
  "vicodin",
  "visit our website",
  "warranty",
  "we hate spam",
  "we honour all",
  "web traffic",
  "weight loss",
  "what are you waiting for",
  "while supplies last",
  "while you sleep",
  "who really wins",
  "why pay more",
  "will not believe your eyes",
  "win",
  "winner",
  "winning",
  "won",
  "work from home",
  "xanax",
  "you are a winner",
  "you have been selected",
  "your income",
  "$$$cash$$$",
].map((s) => s.toLowerCase());

const SORTED_SIMPLER = Object.entries(SIMPLER_ALTERNATIVES).sort(
  (a, b) => b[0].length - a[0].length,
);

const SORTED_SPAM = [...new Set(SPAM_TRIGGERS)].sort(
  (a, b) => b.length - a.length,
);

export function tokenizeWords(text: string): WordMatch[] {
  const words: WordMatch[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(WORD_RE.source, "g");
  let index = 0;
  while ((match = re.exec(text)) !== null) {
    words.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      index: index++,
    });
  }
  return words;
}

/**
 * Split text into sentences.
 * - `.!?` only split when followed by whitespace or end-of-string
 *   (so "test-link.invalid" stays one sentence).
 * - Newlines also act as sentence boundaries
 *   (so "Dear Account Holder," on its own line is its own sentence).
 */
export function splitSentences(text: string): SentenceInfo[] {
  if (!text) return [];

  const sentences: SentenceInfo[] = [];
  let start = 0;

  const pushSlice = (from: number, to: number) => {
    const raw = text.slice(from, to);
    if (!raw.trim()) return;
    let contentStart = from;
    let contentEnd = to;
    while (contentStart < contentEnd && /\s/.test(text[contentStart]!)) {
      contentStart++;
    }
    while (contentEnd > contentStart && /\s/.test(text[contentEnd - 1]!)) {
      contentEnd--;
    }
    if (contentStart >= contentEnd) return;
    const sentenceText = text.slice(contentStart, contentEnd);
    const wordCount = tokenizeWords(sentenceText).length;
    if (wordCount === 0 && !sentenceText.trim()) return;
    sentences.push({
      text: sentenceText,
      start: contentStart,
      end: contentEnd,
      wordCount,
    });
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;

    if (ch === "\n") {
      pushSlice(start, i);
      start = i + 1;
      continue;
    }

    if (ch === "." || ch === "!" || ch === "?") {
      const next = text[i + 1];
      if (next === undefined || /\s/.test(next)) {
        pushSlice(start, i + 1);
        start = i + 1;
        while (start < text.length && /[ \t\r]/.test(text[start]!)) {
          start++;
        }
        i = start - 1;
      }
    }
  }

  if (start < text.length) {
    pushSlice(start, text.length);
  }

  return sentences;
}

/** Vowel-group syllable heuristic with silent-e handling. */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;

  let modified = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  modified = modified.replace(/^y/, "");
  const groups = modified.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function countSyllablesInText(text: string): number {
  return tokenizeWords(text).reduce(
    (sum, w) => sum + countSyllables(w.text),
    0,
  );
}

export function fleschKincaidGrade(
  words: number,
  sentences: number,
  syllables: number,
): number {
  if (words === 0 || sentences === 0) return 0;
  const grade =
    0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.round(grade * 10) / 10;
}

function isPastParticiple(word: string): boolean {
  const lower = word.toLowerCase();
  if (IRREGULAR_PARTICIPLES.has(lower)) return true;
  if (lower.length > 3 && lower.endsWith("ed")) return true;
  return false;
}

function isAdverbCandidate(word: string): boolean {
  const lower = word.toLowerCase();
  if (!lower.endsWith("ly") || lower.length < 4) return false;
  if (ADVERB_STOPLIST.has(lower)) return false;
  return true;
}

function findPhraseMatches(
  text: string,
  entries: Array<[string, string | undefined]>,
): Array<{ start: number; end: number; matched: string; value?: string }> {
  const lower = text.toLowerCase();
  const occupied: boolean[] = new Array(text.length).fill(false);
  const results: Array<{
    start: number;
    end: number;
    matched: string;
    value?: string;
  }> = [];

  for (const [phrase, value] of entries) {
    if (!phrase) continue;
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(phrase, from);
      if (idx === -1) break;
      const end = idx + phrase.length;

      const before = idx === 0 ? "" : lower[idx - 1]!;
      const after = end >= lower.length ? "" : lower[end]!;
      const boundaryBefore = idx === 0 || !/[a-z0-9']/.test(before);
      const boundaryAfter = end >= lower.length || !/[a-z0-9']/.test(after);

      let overlaps = false;
      for (let i = idx; i < end; i++) {
        if (occupied[i]) {
          overlaps = true;
          break;
        }
      }

      if (boundaryBefore && boundaryAfter && !overlaps) {
        for (let i = idx; i < end; i++) occupied[i] = true;
        results.push({
          start: idx,
          end,
          matched: text.slice(idx, end),
          value,
        });
      }
      from = idx + 1;
    }
  }

  return results.sort((a, b) => a.start - b.start);
}

export function findAdverbs(text: string): TextRange[] {
  return tokenizeWords(text)
    .filter((w) => isAdverbCandidate(w.text))
    .map((w) => ({ start: w.start, end: w.end, type: "adverb" as const }));
}

export function findPassiveVoice(text: string): TextRange[] {
  const words = tokenizeWords(text);
  const ranges: TextRange[] = [];

  for (let i = 0; i < words.length; i++) {
    const aux = words[i]!;
    if (!AUXILIARIES.has(aux.text.toLowerCase())) continue;

    let j = i + 1;
    if (j < words.length && isAdverbCandidate(words[j]!.text)) {
      j++;
    }
    if (j >= words.length) continue;

    const participle = words[j]!;
    if (!isPastParticiple(participle.text)) continue;

    // Avoid treating "been" alone after aux as passive without a real participle
    if (
      participle.text.toLowerCase() === "been" &&
      j + 1 < words.length &&
      isPastParticiple(words[j + 1]!.text)
    ) {
      ranges.push({
        start: aux.start,
        end: words[j + 1]!.end,
        type: "passive",
      });
      i = j + 1;
      continue;
    }

    if (participle.text.toLowerCase() === "been") continue;

    ranges.push({ start: aux.start, end: participle.end, type: "passive" });
    i = j;
  }

  return ranges;
}

export function findSimplerAlternatives(text: string): SimplerMatch[] {
  return findPhraseMatches(
    text,
    SORTED_SIMPLER.map(([phrase, value]) => [phrase, value]),
  ).map((m) => ({
    start: m.start,
    end: m.end,
    type: "simpler" as const,
    suggestion: m.value ?? "",
    original: m.matched,
  }));
}

export function analyzeReadability(text: string): ReadabilityAnalysis {
  const sentences = splitSentences(text);
  const words = tokenizeWords(text);
  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, wordCount > 0 ? 1 : 0);
  const syllableCount = words.reduce(
    (sum, w) => sum + countSyllables(w.text),
    0,
  );
  const grade = fleschKincaidGrade(wordCount, sentenceCount, syllableCount);

  const hardSentences: TextRange[] = [];
  const veryHardSentences: TextRange[] = [];

  for (const s of sentences) {
    if (s.wordCount >= 20) {
      veryHardSentences.push({
        start: s.start,
        end: s.end,
        type: "very-hard",
      });
    } else if (s.wordCount >= 14) {
      hardSentences.push({ start: s.start, end: s.end, type: "hard" });
    }
  }

  const adverbs = findAdverbs(text);
  const passiveVoice = findPassiveVoice(text);
  const simplerAlternatives = findSimplerAlternatives(text);

  const ranges: TextRange[] = [
    ...veryHardSentences,
    ...hardSentences,
    ...adverbs,
    ...passiveVoice,
    ...simplerAlternatives,
  ];

  return {
    wordCount,
    sentenceCount: sentences.length,
    syllableCount,
    fleschKincaidGrade: grade,
    hardSentences,
    veryHardSentences,
    adverbs,
    passiveVoice,
    simplerAlternatives,
    ranges,
  };
}

function isShoutingSentence(sentence: string): boolean {
  const letters = sentence.replace(/[^A-Za-z]/g, "");
  if (letters.length < 6) return false;
  return letters === letters.toUpperCase() && /[A-Z]/.test(letters);
}

function findExcessivePunctuation(
  text: string,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const re = /[!?]{2,}|(?:\?!|!\?)+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
}

function riskFromDensity(
  flagCount: number,
  wordCount: number,
  forceHigh: boolean,
): { risk: SpamRisk; score: number } {
  if (forceHigh) {
    return { risk: "High", score: Math.min(100, 70 + flagCount * 5) };
  }
  const density = wordCount === 0 ? (flagCount > 0 ? 1 : 0) : flagCount / wordCount;
  const score = Math.min(100, Math.round(density * 400 + flagCount * 8));
  if (score >= 45 || flagCount >= 5) return { risk: "High", score };
  if (score >= 18 || flagCount >= 2) return { risk: "Medium", score };
  return { risk: "Low", score };
}

export function analyzeSpam(text: string): SpamAnalysis {
  const words = tokenizeWords(text);
  const spamMatches = findPhraseMatches(
    text,
    SORTED_SPAM.map((phrase) => [phrase, undefined]),
  );
  const sentences = splitSentences(text);

  const flags: SpamFlag[] = spamMatches.map((m) => ({
    start: m.start,
    end: m.end,
    type: "spam-word" as const,
    matched: m.matched,
  }));

  let capsSentenceCount = 0;
  for (const s of sentences) {
    if (isShoutingSentence(s.text)) {
      capsSentenceCount++;
      flags.push({
        start: s.start,
        end: s.end,
        type: "all-caps",
        matched: s.text,
      });
    }
  }

  const punct = findExcessivePunctuation(text);
  for (const p of punct) {
    flags.push({
      start: p.start,
      end: p.end,
      type: "excessive-punctuation",
      matched: text.slice(p.start, p.end),
    });
  }

  flags.sort((a, b) => a.start - b.start);

  const forceHigh = capsSentenceCount > 0 || punct.length > 0;
  const { risk, score } = riskFromDensity(
    flags.length,
    words.length,
    forceHigh,
  );

  const ranges: TextRange[] = flags
    .filter((f) => f.type === "spam-word" || f.type === "all-caps")
    .map((f) => ({ start: f.start, end: f.end, type: "spam" as const }));

  return {
    flags,
    risk,
    score,
    triggerCount: spamMatches.length,
    capsSentenceCount,
    excessivePunctuationCount: punct.length,
    ranges,
  };
}

export function combineSpamAnalyses(
  subject: SpamAnalysis,
  body: SpamAnalysis,
): CombinedSpamAnalysis {
  const totalTriggers = subject.triggerCount + body.triggerCount;
  const score = Math.min(100, Math.round(subject.score * 0.45 + body.score * 0.55));
  const forceHigh =
    subject.risk === "High" ||
    body.risk === "High" ||
    subject.capsSentenceCount + body.capsSentenceCount > 0 ||
    subject.excessivePunctuationCount + body.excessivePunctuationCount > 0;

  let risk: SpamRisk = "Low";
  if (forceHigh || score >= 45) risk = "High";
  else if (subject.risk === "Medium" || body.risk === "Medium" || score >= 18) {
    risk = "Medium";
  }

  return {
    subject,
    body,
    risk,
    score,
    totalTriggers,
    ranges: [...subject.ranges, ...body.ranges],
  };
}

/**
 * Deterministic mock AI-detection score (0–100).
 * Heuristic: uniform sentence length + low adverb/slang density + formal phrasing
 * tends to score higher. Not a real detector — for UI scaffolding only.
 */
export function mockAiDetectionScore(text: string): number {
  if (!text.trim()) return 0;
  const sentences = splitSentences(text);
  const words = tokenizeWords(text);
  if (words.length < 8) return Math.min(35, words.length * 3);

  const lengths = sentences.map((s) => s.wordCount).filter((n) => n > 0);
  const avg =
    lengths.reduce((a, b) => a + b, 0) / Math.max(lengths.length, 1);
  const variance =
    lengths.reduce((sum, n) => sum + (n - avg) ** 2, 0) /
    Math.max(lengths.length, 1);
  const uniformity = Math.max(0, 40 - Math.sqrt(variance) * 4);

  const avgWordLen =
    words.reduce((s, w) => s + w.text.length, 0) / words.length;
  const formality = Math.min(30, Math.max(0, (avgWordLen - 4) * 8));

  const simplerHits = findSimplerAlternatives(text).length;
  const buzz = Math.min(25, simplerHits * 6);

  const grade = fleschKincaidGrade(
    words.length,
    Math.max(sentences.length, 1),
    countSyllablesInText(text),
  );
  const gradeBoost = grade >= 10 && grade <= 14 ? 15 : grade > 14 ? 8 : 5;

  return Math.max(
    5,
    Math.min(98, Math.round(uniformity + formality + buzz + gradeBoost)),
  );
}

export function analyzeText(text: string): FullAnalysis {
  const readability = analyzeReadability(text);
  const spam = analyzeSpam(text);
  const ranges: TextRange[] = [...readability.ranges, ...spam.ranges];
  return {
    readability,
    spam,
    ranges,
    aiDetectionScore: mockAiDetectionScore(text),
  };
}

/**
 * Convert highlight ranges into contiguous runs covering `text`.
 * Word-level types layer on top of sentence-level shading in the same run.
 */
export function buildHighlightRuns(
  text: string,
  ranges: TextRange[],
): HighlightRun[] {
  if (!text) return [];
  if (ranges.length === 0) {
    return [{ text, start: 0, end: text.length, types: [] }];
  }

  const bounds = new Set<number>([0, text.length]);
  for (const r of ranges) {
    const start = Math.max(0, Math.min(text.length, r.start));
    const end = Math.max(0, Math.min(text.length, r.end));
    if (end > start) {
      bounds.add(start);
      bounds.add(end);
    }
  }
  const points = [...bounds].sort((a, b) => a - b);
  const runs: HighlightRun[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]!;
    const end = points[i + 1]!;
    if (end <= start) continue;
    const types: HighlightType[] = [];
    for (const r of ranges) {
      if (r.start <= start && r.end >= end) {
        if (!types.includes(r.type)) types.push(r.type);
      }
    }
    runs.push({ text: text.slice(start, end), start, end, types });
  }

  return runs;
}

export function mergeAnalysisRanges(
  readability: ReadabilityAnalysis,
  spam: SpamAnalysis,
): TextRange[] {
  return [...readability.ranges, ...spam.ranges];
}
