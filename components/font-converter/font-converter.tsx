"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeftRight, Clipboard, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { FontConverter, TextSide } from "@/lib/font-converters/registry";
import { romanToDevanagari, type RomanScheme } from "@/lib/font-converters/roman";
import { downloadBlob } from "@/lib/files/download";
import { Button, buttonVariants } from "@/components/ui/button";

const PLACEHOLDERS: Record<string, string> = {
  devanagari: "यूनिकोड यहाँ टाइप या पेस्ट करें",
  bengali: "ইউনিকোড এখানে টাইপ বা পেস্ট করুন",
  latin: "Type or paste your text here",
};

function fontStack(side: TextSide) {
  if (!side.font) return undefined;
  return [side.font, side.fallbackFont].filter(Boolean).map((font) => `"${font}"`).join(", ");
}

function counts(text: string) {
  const trimmed = text.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/u).length : 0,
    characters: Array.from(text).length,
    withoutSpaces: Array.from(text.replace(/\s/gu, "")).length,
  };
}

function Counts({ text }: { text: string }) {
  const c = counts(text);
  return <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground" aria-live="polite">
    <span className="rounded-full bg-muted px-3 py-1">Total Words: <b className="text-foreground">{c.words}</b></span>
    <span className="rounded-full bg-muted px-3 py-1">Total Characters: <b className="text-foreground">{c.characters}</b></span>
    <span className="rounded-full bg-muted px-3 py-1">Characters (Excluding Spaces): <b className="text-foreground">{c.withoutSpaces}</b></span>
  </div>;
}

export function FontConverterTool({ converter, reverse }: { converter: FontConverter; reverse?: { slug: string; name: string } }) {
  const { from, to } = converter;
  const input = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [changes, setChanges] = useState<number | undefined>();
  const [phonetic, setPhonetic] = useState(false);
  const [scheme, setScheme] = useState<RomanScheme>("hinglish");
  const [caret, setCaret] = useState(0);
  const canTransliterate = from.script === "devanagari";
  const inputFont = fontStack(from);
  const outputFont = fontStack(to);

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !input.current) return;
    input.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [text]);

  // The Latin word being typed just before the caret, and what it becomes in Devanagari.
  const typingWord = phonetic ? (text.slice(0, caret).match(/[A-Za-z]+$/)?.[0] ?? "") : "";
  const suggestion = useMemo(() => (typingWord ? romanToDevanagari(typingWord) : ""), [typingWord]);

  const acceptSuggestion = (append = "") => {
    const el = input.current;
    if (!el || !typingWord) return false;
    const end = el.selectionStart;
    const start = end - typingWord.length;
    const next = text.slice(0, start) + suggestion + append + text.slice(el.selectionEnd);
    pendingCaret.current = start + suggestion.length + append.length;
    setText(next);
    setCaret(pendingCaret.current);
    return true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!phonetic || event.ctrlKey || event.metaKey || event.altKey) return;
    const separators: Record<string, string> = { " ": " ", Enter: "\n", ".": "।", ",": ",", "?": "?", "!": "!" };
    if (event.key in separators && typingWord && event.currentTarget.selectionStart === event.currentTarget.selectionEnd) {
      event.preventDefault();
      acceptSuggestion(separators[event.key]);
    }
  };

  const convert = async () => {
    if (!text.trim()) {
      toast.error(`Paste some ${from.label} text first.`);
      input.current?.focus();
      return;
    }
    // The font tables are large, so they load on first use rather than with the page.
    const { convertText } = await import("@/lib/font-converters/engines");
    const result = convertText(converter.slug, text, { romanScheme: scheme });
    setOutput(result.text);
    setChanges(result.changes);
    requestAnimationFrame(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const clear = () => {
    setText("");
    setOutput("");
    setChanges(undefined);
    input.current?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success(to.font ? `Copied. Paste it into a document set to the ${to.font} font.` : "Converted text copied.");
    } catch {
      toast.error("Couldn't copy — select the text and press Ctrl+C instead.");
    }
  };

  const download = (kind: "txt" | "doc") => {
    const name = `${converter.slug}.${kind}`;
    if (kind === "txt") return downloadBlob(new Blob([`﻿${output}`], { type: "text/plain;charset=utf-8" }), name);
    // A Word-readable HTML document with the target font already applied.
    const escaped = output.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:${outputFont ?? "Mangal, sans-serif"};font-size:16pt;white-space:pre-wrap}</style></head><body>${escaped}</body></html>`;
    downloadBlob(new Blob([html], { type: "application/msword" }), name);
  };

  return <div className="mx-auto max-w-4xl space-y-6">
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="converter-input" className="font-semibold">Paste {from.label} Text Here:</label>
        {canTransliterate && <fieldset className="flex items-center gap-3 text-sm">
          <legend className="sr-only">Phonetic typing</legend>
          <span className="font-semibold">Transliteration:</span>
          {([["off", false], ["on", true]] as const).map(([label, value]) => <label key={label} className="flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="phonetic" className="accent-primary" checked={phonetic === value} onChange={() => { setPhonetic(value); input.current?.focus(); }} />
            {value ? "ON (Hindi / Marathi)" : "OFF"}
          </label>)}
        </fieldset>}
      </div>

      {canTransliterate && phonetic && <div className="flex min-h-9 items-center gap-2 overflow-x-auto rounded-md bg-muted/60 px-3 text-sm">
        {suggestion
          ? <button type="button" className="rounded border bg-card px-2 py-0.5 text-base shadow-sm hover:border-primary" onMouseDown={(event) => event.preventDefault()} onClick={() => acceptSuggestion(" ")}>{suggestion}</button>
          : <span className="italic text-muted-foreground">Type in English letters — e.g. “namaste” becomes नमस्ते. Press Space to accept.</span>}
      </div>}

      <textarea
        id="converter-input"
        ref={input}
        value={text}
        onChange={(event) => { setText(event.target.value); setCaret(event.target.selectionStart); }}
        onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
        placeholder={from.font ? `Paste ${from.label} text here` : PLACEHOLDERS[from.script ?? "latin"]}
        spellCheck={from.script === "latin"}
        className="min-h-64 w-full resize-y rounded-xl border bg-muted/30 p-4 text-lg leading-relaxed shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ fontFamily: inputFont }}
      />
      <Counts text={text} />
      {converter.slug === "hindi-to-roman" && <fieldset className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <legend className="sr-only">Romanisation style</legend>
        {([["hinglish", "Simple (Hinglish): bharat, namaste"], ["iast", "IAST: bhārata, namaste"]] as const).map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-1.5">
          <input type="radio" name="scheme" className="accent-primary" checked={scheme === value} onChange={() => setScheme(value)} /> {label}
        </label>)}
      </fieldset>}
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border">
        <button type="button" onClick={convert} className="bg-card px-4 py-3 font-semibold transition hover:bg-brand hover:text-white">Convert to {to.label}</button>
        <button type="button" onClick={clear} className="flex items-center justify-center gap-2 border-l bg-card px-4 py-3 transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" /> Delete</button>
      </div>
      {from.font && <p className="text-center text-xs text-muted-foreground">
        Your {from.label} text is shown in the {from.font} font{from.font === "Kruti Dev 010" || from.fallbackFont ? "" : " if it's installed on this device"}. Paste it exactly as copied from your document.
      </p>}
    </section>

    <section className="space-y-3" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="converter-output" className="font-semibold">{to.label} Text:</label>
        {changes !== undefined && <span className="text-sm text-muted-foreground">{changes} {changes === 1 ? "word" : "words"} changed</span>}
      </div>
      <textarea
        id="converter-output"
        ref={outputRef}
        value={output}
        readOnly
        placeholder="Converted text will appear here"
        className="min-h-64 w-full resize-y rounded-xl border bg-card p-4 text-lg leading-relaxed shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ fontFamily: outputFont }}
      />
      {output && <Counts text={output} />}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" disabled={!output} onClick={copy}><Clipboard /> Copy</Button>
        <Button variant="outline" disabled={!output} onClick={() => download("txt")}><Download /> Text file</Button>
        <Button variant="outline" disabled={!output} onClick={() => download("doc")}><FileText /> Word file</Button>
        {reverse && <Link href={`/${reverse.slug}`} className={buttonVariants({ variant: "ghost" })}><ArrowLeftRight /> {reverse.name}</Link>}
      </div>
      {to.font && <p className="text-center text-xs text-muted-foreground">
        {to.label} text is stored as English letters that the {to.font} font draws as {converter.language}. After pasting, set the font to {to.font} in Word, PageMaker or CorelDRAW — the Word file download already has it applied.
      </p>}
    </section>
  </div>;
}
