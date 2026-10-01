"use client";

import { useMemo, useState } from "react";
import { NumberField, SegmentedControl, TextAreaField } from "@/components/shared/form-fields";
import { CopyButton, ResetButton } from "@/components/shared/result-actions";
import { toCodeCase, type CodeCase } from "@/lib/dev-tools/convert";

const STOP_WORDS = new Set("a an and are as at be by for from has he in is it its of on or that the to was were will with you your this they their we our i".split(" "));

export function WordCharacterCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => {
    const words = text.trim().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [];
    const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).length : 0;
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
    const minutes = words.length / 200;
    const frequency = new Map<string, number>();
    for (const word of words.map((value) => value.toLocaleLowerCase()).filter((value) => value.length > 2 && !STOP_WORDS.has(value))) frequency.set(word, (frequency.get(word) ?? 0) + 1);
    const keywords = [...frequency].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
    return { words: words.length, characters: text.length, charactersNoSpaces: text.replace(/\s/g, "").length, sentences, paragraphs, minutes, keywords };
  }, [text]);
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
    <section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Enter or paste text</h2><TextAreaField label="Text to analyze" value={text} onChange={setText} rows={16} placeholder="Start typing or paste your content here…" /><div className="flex gap-2"><CopyButton text={text} label="Copy text" saveable={false} /><ResetButton onReset={() => setText("")} /></div></section>
    <section aria-live="polite" className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Text statistics</h2><dl className="mt-3 divide-y">{[["Words", stats.words], ["Characters", stats.characters], ["Characters without spaces", stats.charactersNoSpaces], ["Sentences", stats.sentences], ["Paragraphs", stats.paragraphs], ["Estimated reading time", stats.words ? stats.minutes < 1 ? "Less than 1 min" : `${Math.ceil(stats.minutes)} min` : "0 min"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-2.5"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{value}</dd></div>)}</dl><h3 className="mt-6 font-semibold">Top keywords</h3>{stats.keywords.length ? <ul className="mt-3 space-y-2">{stats.keywords.map(([word, count]) => <li key={word} className="flex items-center justify-between gap-4 text-sm"><span className="break-all">{word}</span><span className="text-muted-foreground">{count} · {stats.words ? ((count / stats.words) * 100).toFixed(1) : 0}%</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Add text to see frequently used words and density.</p>}</section>
  </div>;
}

type CaseMode = "upper" | "lower" | "title" | "sentence" | "alternating" | CodeCase;
const CASE_OPTIONS = [{ value: "upper", label: "UPPERCASE" }, { value: "lower", label: "lowercase" }, { value: "title", label: "Title Case" }, { value: "sentence", label: "Sentence case" }, { value: "alternating", label: "aLtErNaTiNg" }] as const;
const CODE_CASE_OPTIONS = [{ value: "camel", label: "camelCase" }, { value: "pascal", label: "PascalCase" }, { value: "snake", label: "snake_case" }, { value: "constant", label: "CONSTANT_CASE" }, { value: "kebab", label: "kebab-case" }, { value: "dot", label: "dot.case" }, { value: "path", label: "path/case" }] as const;
const CODE_CASES = new Set<string>(CODE_CASE_OPTIONS.map((option) => option.value));
function convertCase(text: string, mode: CaseMode) {
  // Programming cases convert each line separately, so a list of names stays a list.
  if (CODE_CASES.has(mode)) return text.split("\n").map((line) => toCodeCase(line, mode as CodeCase)).join("\n");
  if (mode === "upper") return text.toLocaleUpperCase();
  if (mode === "lower") return text.toLocaleLowerCase();
  if (mode === "title") return text.toLocaleLowerCase().replace(/(^|[\s–—-])([\p{L}\p{N}])/gu, (_, before, letter) => before + letter.toLocaleUpperCase());
  if (mode === "sentence") return text.toLocaleLowerCase().replace(/(^|[.!?]\s+)([\p{L}])/gu, (_, before, letter) => before + letter.toLocaleUpperCase());
  let index = 0;
  return [...text].map((character) => /[\p{L}]/u.test(character) ? (index++ % 2 ? character.toLocaleUpperCase() : character.toLocaleLowerCase()) : character).join("");
}
export function CaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("upper");
  const output = convertCase(text, mode);
  return <div className="grid gap-6 lg:grid-cols-2"><section className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Original text</h2><TextAreaField label="Text to convert" value={text} onChange={setText} rows={12} placeholder="Paste or type text here…" /><SegmentedControl label="Writing cases" value={mode} onChange={setMode} options={[...CASE_OPTIONS]} /><SegmentedControl label="Programming cases (each line converts separately)" value={mode} onChange={setMode} options={[...CODE_CASE_OPTIONS]} /></section><section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Converted text</h2><TextAreaField label="Result" value={output} onChange={() => {}} rows={12} /><div className="flex gap-2"><CopyButton text={output} label="Copy converted text" saveable={false} /><ResetButton onReset={() => setText("")} /></div></section></div>;
}

const INVISIBLE = [{ name: "Braille blank", character: "⠀", code: "U+2800", note: "Visible width; commonly accepted in some profile and message fields." }, { name: "Zero-width space", character: "​", code: "U+200B", note: "No visible width; some platforms remove it automatically." }, { name: "Hangul filler", character: "ㅤ", code: "U+3164", note: "A wider invisible-looking compatibility character." }];
export function InvisibleCharacterTool() {
  const [count, setCount] = useState("1");
  const amount = Math.min(100, Math.max(1, Number.parseInt(count, 10) || 1));
  return <section className="space-y-6 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><div className="max-w-sm"><NumberField label="Number of characters" value={count} onChange={setCount} hint="Copy between 1 and 100 invisible characters." /></div><div className="grid gap-4 md:grid-cols-3">{INVISIBLE.map((item) => <article key={item.code} className="flex flex-col rounded-xl border p-5"><h2 className="font-semibold">{item.name}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">{item.code}</p><div className="my-4 min-h-12 rounded-lg bg-muted p-3 text-center ring-1 ring-inset ring-foreground/10" aria-label={`${item.name} preview`}>{item.character.repeat(Math.min(amount, 10))}</div><p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{item.note}</p><CopyButton text={item.character.repeat(amount)} label={`Copy ${item.name}`} saveable={false} /></article>)}</div><p className="text-sm text-muted-foreground">Platform support varies. Test the pasted result before relying on it, and follow the destination service’s naming and content rules.</p></section>;
}

const LOREM_SENTENCES = ["Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.", "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."];
type LoremMode = "paragraphs" | "sentences" | "words";
function makeLorem(mode: LoremMode, count: number) {
  if (mode === "sentences") return Array.from({ length: count }, (_, i) => LOREM_SENTENCES[i % LOREM_SENTENCES.length]).join(" ");
  if (mode === "words") return Array.from({ length: count }, (_, i) => LOREM_SENTENCES.join(" ").replace(/[.,]/g, "").split(/\s+/)[i % 69]).join(" ");
  return Array.from({ length: count }, (_, i) => Array.from({ length: 4 }, (__, j) => LOREM_SENTENCES[(i + j) % LOREM_SENTENCES.length]).join(" ")).join("\n\n");
}
export function LoremIpsumGenerator() {
  const [mode, setMode] = useState<LoremMode>("paragraphs"); const [count, setCount] = useState("3");
  const limit = mode === "words" ? 500 : mode === "sentences" ? 50 : 20; const amount = Math.min(limit, Math.max(1, Number.parseInt(count, 10) || 1)); const output = makeLorem(mode, amount);
  return <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><section className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Generator options</h2><SegmentedControl label="Generate by" value={mode} onChange={setMode} options={[{ value: "paragraphs", label: "Paragraphs" }, { value: "sentences", label: "Sentences" }, { value: "words", label: "Words" }]} /><NumberField label={`Number of ${mode}`} value={count} onChange={setCount} hint={`Maximum ${limit}.`} /></section><section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Generated dummy text</h2><TextAreaField label="Lorem ipsum output" value={output} onChange={() => {}} rows={15} /><CopyButton text={output} label="Copy Lorem Ipsum" saveable={false} /></section></div>;
}

export function CaptionSpacer() {
  const [text, setText] = useState("");
  const output = text.split("\n").map((line) => line.trim() === "" ? "⠀" : line.replace(/[ \t]+$/g, "")).join("\n");
  return <div className="grid gap-6 lg:grid-cols-2"><section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Write your caption</h2><TextAreaField label="Caption with blank lines" value={text} onChange={setText} rows={14} placeholder={'First paragraph\n\nSecond paragraph\n\n#hashtags'} /></section><section className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"><h2 className="font-semibold">Spaced caption</h2><TextAreaField label="Formatted result" value={output} onChange={() => {}} rows={14} /><div className="flex gap-2"><CopyButton text={output} label="Copy spaced caption" saveable={false} /><ResetButton onReset={() => setText("")} /></div><p className="text-xs leading-relaxed text-muted-foreground">Empty lines contain a Braille blank character so compatible platforms are less likely to collapse them. Preview the pasted caption before publishing.</p></section></div>;
}
