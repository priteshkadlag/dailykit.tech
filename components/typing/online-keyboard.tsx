"use client";

import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Clipboard, Code2, Download, Italic, List, ListOrdered, Printer, Redo2, Trash2, Underline, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { KeyboardKey } from "@/lib/keyboard-layouts.generated";
import type { KeyboardDefinition } from "@/lib/keyboard-data";
import { downloadBlob } from "@/lib/files/download";
import { Button } from "@/components/ui/button";

/** Physical key for each key id: index n is key `kn` (see KeyboardDefinition.keys). */
const KEY_CODES = [
  "Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal",
  "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash",
  "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote",
  "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash",
  "IntlBackslash",
] as const;
/** On-screen rows as [first, last) key indexes. k47 (IntlBackslash) repeats Backslash on every layout, so it isn't drawn. */
const ROWS = [[0, 13], [13, 26], [26, 37], [37, 47]] as const;
const CODE_TO_ID = new Map<string, string>(KEY_CODES.map((code, index) => [code, `k${index}`]));

const FONTS = [
  { label: "System Font", value: "system-ui" },
  { label: "Arial", value: "Arial" },
  { label: "Arial Black", value: "Arial Black" },
  { label: "Book Antiqua", value: "Book Antiqua" },
  { label: "Comic Sans MS", value: "Comic Sans MS" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Impact", value: "Impact" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana" },
];

/** Invisible characters get a readable name on the keycap. */
const INVISIBLE: Record<string, string> = { "‌": "ZWNJ", "‍": "ZWJ", "‎": "LRM", "‏": "RLM" };
const keyLabel = (value?: string) => (value ? (INVISIBLE[value] ?? (value.replace(/[‌-‏]/g, "") || value)) : "");

const keepFocus = (event: MouseEvent) => event.preventDefault();

function cleanHtml(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((node) => node.remove());
  clone.querySelectorAll("*").forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      if (attr.name.startsWith("on") || /^\s*javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
    }
  });
  return clone.innerHTML;
}

export function OnlineKeyboard({ keyboard }: { keyboard: KeyboardDefinition }) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [text, setText] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [shift, setShift] = useState(false);
  const [altGr, setAltGr] = useState(false);
  const [fontFamily, setFontFamily] = useState(keyboard.fonts?.[0]?.value ?? "system-ui");
  const keyMap = useMemo(() => new Map(keyboard.keys.map((key) => [key.id, key])), [keyboard.keys]);
  const rows = useMemo(() => ROWS.map(([start, end]) => Array.from({ length: end - start }, (_, i) => keyMap.get(`k${start + i}`)).filter((key): key is KeyboardKey => !!key)), [keyMap]);
  const hasAlt = useMemo(() => keyboard.keys.some((key) => key.alt), [keyboard.keys]);
  const fonts = useMemo<NonNullable<KeyboardDefinition["fonts"]>>(() => [...(keyboard.fonts ?? []), ...FONTS.filter((font) => !keyboard.fonts?.some((own) => own.value === font.value))], [keyboard.fonts]);
  const keycapFont = keyboard.legacy ? keyboard.fonts?.[0]?.value : undefined;
  const dir = keyboard.direction ?? "ltr";
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const characters = Array.from(text).length;
  const withoutSpaces = Array.from(text.replace(/\s/gu, "")).length;

  // Remember the caret so on-screen keys type where the user left off, even after clicking elsewhere.
  useEffect(() => {
    const remember = () => {
      const selection = document.getSelection();
      if (selection?.rangeCount && editor.current?.contains(selection.anchorNode)) savedRange.current = selection.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", remember);
    return () => document.removeEventListener("selectionchange", remember);
  }, []);

  const focusEditor = () => {
    const node = editor.current;
    if (!node || document.activeElement === node) return;
    node.focus();
    const selection = document.getSelection();
    if (!selection) return;
    let range = savedRange.current;
    if (!range || !node.contains(range.startContainer)) {
      range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  };
  const sync = () => setText(editor.current?.innerText ?? "");
  const command = (name: string, value?: string) => { focusEditor(); document.execCommand(name, false, value); sync(); };
  const insert = (value: string) => { command("insertText", value); setShift(false); setAltGr(false); };
  const charFor = (key: KeyboardKey, useShift: boolean, useAlt: boolean) => (useAlt ? key.alt : useShift ? (key.shift ?? key.normal) : key.normal);
  const pressKey = (key: KeyboardKey) => { const value = charFor(key, shift, altGr); if (value) insert(value); };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (keyboard.legacy || event.metaKey || event.nativeEvent.isComposing) return;
    // Windows reports AltGr as Ctrl+Alt.
    const alt = event.getModifierState("AltGraph") || (event.ctrlKey && event.altKey);
    if (!alt && (event.ctrlKey || event.altKey)) return;
    const id = CODE_TO_ID.get(event.code);
    const key = id ? keyMap.get(id) : undefined;
    if (!key) return;
    // Caps Lock only matters for scripts with capital letters (Russian, Greek, Turkish…).
    const cased = !!key.shift && key.shift !== key.normal && key.shift === key.normal.toLocaleUpperCase();
    const upper = cased && event.getModifierState("CapsLock") ? !event.shiftKey : event.shiftKey;
    event.preventDefault();
    const value = charFor(key, upper, alt);
    if (value) { document.execCommand("insertText", false, value); sync(); }
  };
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    // Paste as plain text so outside styles and markup don't come along.
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    sync();
  };

  const clearAll = () => {
    if (!editor.current?.textContent && !editor.current?.querySelector("img")) return;
    // Select-and-delete (rather than emptying innerHTML) so Undo can bring the text back.
    command("selectAll");
    command("delete");
    toast("Text cleared.", { action: { label: "Undo", onClick: () => command("undo") } });
  };
  const copyAll = async () => {
    if (!text.trim()) return toast.error("Type something first.");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(keyboard.legacy ? `Copied. Paste it into a document set to the ${fontFamily} font.` : "Text copied.");
    } catch {
      toast.error("Couldn't copy — select the text and press Ctrl+C instead.");
    }
  };
  const documentHtml = (forPrint: boolean) => {
    const own = fonts.find((font) => font.value === fontFamily);
    const face = forPrint && own?.src ? `@font-face{font-family:"${own.value}";src:url("${new URL(own.src, location.origin)}") format("woff")}` : "";
    return `<!doctype html><html><head><meta charset="utf-8"><title>${keyboard.name}</title><style>${face}body{font-family:"${fontFamily}",system-ui,sans-serif;font-size:18px;line-height:1.7;white-space:pre-wrap;${forPrint ? "padding:32px;" : ""}}</style></head><body dir="${dir}">${cleanHtml(editor.current!)}</body></html>`;
  };
  const save = (kind: "txt" | "doc") => {
    if (!text.trim()) return toast.error("Type something first.");
    const body = kind === "txt" ? text : documentHtml(false);
    downloadBlob(new Blob([kind === "txt" ? `﻿${body}` : body], { type: kind === "txt" ? "text/plain;charset=utf-8" : "application/msword" }), `${keyboard.slug}.${kind}`);
  };
  const print = () => {
    if (!text.trim()) return toast.error("Type something first.");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return toast.error("Allow pop-ups to print this document.");
    win.document.write(documentHtml(true));
    win.document.close();
    win.focus();
    // Wait for the font (Kruti Dev in particular) so the printout isn't in a fallback font.
    win.document.fonts.ready.then(() => win.print());
  };

  const keyClass = "flex h-14 min-w-11 flex-col items-center justify-center rounded-md border bg-card px-1 shadow-sm transition hover:border-primary hover:bg-accent active:translate-y-px disabled:pointer-events-none disabled:opacity-40";
  const modClass = (active = false) => `rounded-md border px-3 text-xs font-medium shadow-sm transition ${active ? "border-transparent bg-brand text-white" : "bg-card hover:bg-accent"}`;

  return <div className="space-y-6">
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="outline" onClick={copyAll}><Clipboard /> Copy All</Button>
      <Button variant="outline" onClick={print}><Printer /> Print</Button>
      <Button variant="outline" onClick={clearAll}><Trash2 /> Clear</Button>
      <Button variant="outline" onClick={() => save("txt")}><Download /> Text</Button>
      <Button variant="outline" onClick={() => save("doc")}><Download /> Doc</Button>
    </div>

    <section className="overflow-hidden rounded-xl bg-card shadow-lg ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2" role="toolbar" aria-label="Text formatting">
        <Button size="icon-sm" variant="ghost" aria-label="Undo" onMouseDown={keepFocus} onClick={() => command("undo")}><Undo2 /></Button><Button size="icon-sm" variant="ghost" aria-label="Redo" onMouseDown={keepFocus} onClick={() => command("redo")}><Redo2 /></Button>
        <select aria-label="Paragraph style" defaultValue="" className="h-8 rounded-md border bg-background px-2 text-sm" onChange={(event) => { command("formatBlock", `<${event.target.value}>`); event.target.value = ""; }}><option value="" disabled hidden>Style</option><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option></select>
        <select aria-label="Font" value={fontFamily} className="h-8 min-w-32 rounded-md border bg-background px-2 text-sm" onChange={(event) => setFontFamily(event.target.value)}>{fonts.map((font) => <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</option>)}</select>
        <Button size="icon-sm" variant="ghost" aria-label="Bold" onMouseDown={keepFocus} onClick={() => command("bold")}><Bold /></Button><Button size="icon-sm" variant="ghost" aria-label="Italic" onMouseDown={keepFocus} onClick={() => command("italic")}><Italic /></Button><Button size="icon-sm" variant="ghost" aria-label="Underline" onMouseDown={keepFocus} onClick={() => command("underline")}><Underline /></Button>
        <Button size="icon-sm" variant="ghost" aria-label="Align left" onMouseDown={keepFocus} onClick={() => command("justifyLeft")}><AlignLeft /></Button><Button size="icon-sm" variant="ghost" aria-label="Align center" onMouseDown={keepFocus} onClick={() => command("justifyCenter")}><AlignCenter /></Button><Button size="icon-sm" variant="ghost" aria-label="Align right" onMouseDown={keepFocus} onClick={() => command("justifyRight")}><AlignRight /></Button>
        <Button size="icon-sm" variant="ghost" aria-label="Bulleted list" onMouseDown={keepFocus} onClick={() => command("insertUnorderedList")}><List /></Button><Button size="icon-sm" variant="ghost" aria-label="Numbered list" onMouseDown={keepFocus} onClick={() => command("insertOrderedList")}><ListOrdered /></Button><Button size="icon-sm" variant="ghost" aria-label="Remove formatting" onMouseDown={keepFocus} onClick={() => command("removeFormat")}><Code2 /></Button>
      </div>
      <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={`${keyboard.name} typing area`} dir={dir} spellCheck={false} onInput={sync} onKeyDown={onKeyDown} onPaste={onPaste} className="min-h-72 whitespace-pre-wrap wrap-break-word p-4 text-lg leading-relaxed outline-none" style={{ fontFamily }} />
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground" aria-live="polite"><span>Total words: <b className="text-foreground">{words}</b></span><span>Total characters: <b className="text-foreground">{characters}</b></span><span>Characters excluding spaces: <b className="text-foreground">{withoutSpaces}</b></span></div>
    </section>
    {keyboard.legacy && <p className="text-center text-sm text-muted-foreground">Kruti Dev text is stored as English letters that the Kruti Dev font draws as Hindi. To read it in Word or another app, set the text to the same Kruti Dev font there.</p>}

    <div className="text-center"><Button variant="outline" onClick={() => setShowKeyboard((shown) => !shown)} aria-expanded={showKeyboard}>{showKeyboard ? "Hide" : "Show"} keyboard layout</Button></div>
    {showKeyboard && <div className="overflow-x-auto rounded-xl bg-muted p-2 sm:p-4" role="group" aria-label={`${keyboard.name} layout`}>
      <div className="mx-auto min-w-180 max-w-5xl space-y-1.5" dir="ltr">
        {rows.map((row, rowIndex) => <div key={rowIndex} className="flex justify-center gap-1.5">
          {rowIndex === 1 && <button type="button" className={`min-w-16 ${modClass()}`} onMouseDown={keepFocus} onClick={() => insert("\t")}>Tab</button>}
          {rowIndex === 2 && <span className="min-w-20" aria-hidden />}
          {rowIndex === 3 && <button type="button" aria-pressed={shift} className={`min-w-24 ${modClass(shift)}`} onMouseDown={keepFocus} onClick={() => setShift((value) => !value)}>Shift</button>}
          {row.map((key) => {
            const active = charFor(key, shift, altGr);
            return <button type="button" key={key.id} disabled={!active} aria-label={keyLabel(active) || undefined} className={keyClass} onMouseDown={keepFocus} onClick={() => pressKey(key)}>
              <span className={`text-xs ${shift && !altGr ? "text-foreground" : "text-muted-foreground"}`} style={{ fontFamily: keycapFont }}>{keyLabel(key.shift) || " "}</span>
              <span className={`text-lg leading-none ${shift || altGr ? "opacity-50" : ""}`} style={{ fontFamily: keycapFont }}>{keyLabel(key.normal) || " "}</span>
              {hasAlt && <span className={`text-[10px] leading-none ${altGr ? "font-semibold text-primary" : "text-primary/70"}`}>{keyLabel(key.alt) || " "}</span>}
            </button>;
          })}
          {rowIndex === 0 && <button type="button" className={`min-w-24 ${modClass()}`} onMouseDown={keepFocus} onClick={() => command("delete")}>Backspace</button>}
          {rowIndex === 2 && <button type="button" className={`min-w-20 ${modClass()}`} onMouseDown={keepFocus} onClick={() => command("insertParagraph")}>Enter</button>}
          {rowIndex === 3 && <button type="button" aria-pressed={shift} className={`min-w-24 ${modClass(shift)}`} onMouseDown={keepFocus} onClick={() => setShift((value) => !value)}>Shift</button>}
        </div>)}
        <div className="flex justify-center gap-1.5">
          <button type="button" className="h-11 w-80 rounded-md border bg-card text-xs text-muted-foreground shadow-sm hover:bg-accent" onMouseDown={keepFocus} onClick={() => insert(" ")}>Space</button>
          {hasAlt && <button type="button" aria-pressed={altGr} title="Type the small characters shown at the bottom of keys (Ctrl+Alt or AltGr on your keyboard)" className={`min-w-20 ${modClass(altGr)}`} onMouseDown={keepFocus} onClick={() => setAltGr((value) => !value)}>AltGr</button>}
        </div>
      </div>
    </div>}
  </div>;
}
