"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, Mic, MicOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckboxField, SelectField } from "@/components/shared/form-fields";
import { CopyButton } from "@/components/shared/result-actions";
import { Button } from "@/components/ui/button";

// The Web Speech API isn't in TypeScript's DOM types yet; this is the part we use.
interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; 0: RecognitionAlternative }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionConstructor = new () => Recognition;

const getRecognition = (): RecognitionConstructor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};
const noopSubscribe = () => () => {};

const LANGUAGES = [
  ["en-IN", "English (India)"], ["en-US", "English (US)"], ["en-GB", "English (UK)"], ["hi-IN", "हिन्दी Hindi"], ["mr-IN", "मराठी Marathi"],
  ["gu-IN", "ગુજરાતી Gujarati"], ["bn-IN", "বাংলা Bengali"], ["ta-IN", "தமிழ் Tamil"], ["te-IN", "తెలుగు Telugu"], ["kn-IN", "ಕನ್ನಡ Kannada"],
  ["ml-IN", "മലയാളം Malayalam"], ["pa-IN", "ਪੰਜਾਬੀ Punjabi"], ["ur-IN", "اردو Urdu"], ["ne-NP", "नेपाली Nepali"], ["ar-SA", "العربية Arabic"],
  ["es-ES", "Español"], ["fr-FR", "Français"], ["de-DE", "Deutsch"], ["pt-BR", "Português (Brasil)"], ["ja-JP", "日本語"], ["zh-CN", "中文 (普通话)"],
] as const;

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow the microphone for this site in your browser's address bar, then try again.",
  "service-not-allowed": "Your browser's speech service isn't available. Try Chrome or Edge.",
  "audio-capture": "No microphone was found. Plug one in or check your system sound settings.",
  network: "The speech service couldn't be reached. Check your internet connection.",
  "language-not-supported": "This language isn't supported by your browser's speech service.",
};

/** Applies spoken commands like "new line" (English only). */
function applyCommands(text: string) {
  return text
    .replace(/\s*\bnew paragraph\b\s*/gi, "\n\n")
    .replace(/\s*\bnew line\b\s*/gi, "\n")
    .replace(/\s+\b(full stop|period)\b/gi, ".")
    .replace(/\s+\bcomma\b/gi, ",")
    .replace(/\s+\bquestion mark\b/gi, "?");
}

export function SpeechToText() {
  const supported = useSyncExternalStore(noopSubscribe, () => getRecognition() !== null, () => true);
  const [lang, setLang] = useState("en-IN");
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commands, setCommands] = useState(true);
  const recognition = useRef<Recognition | null>(null);
  const wantListening = useRef(false);
  const commandsRef = useRef(commands);
  useEffect(() => { commandsRef.current = commands; }, [commands]);

  useEffect(() => () => { wantListening.current = false; recognition.current?.stop(); }, []);

  const start = () => {
    const Ctor = getRecognition();
    if (!Ctor) return;
    setError(null);
    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText) {
        const cleaned = commandsRef.current && lang.startsWith("en") ? applyCommands(finalText.trim()) : finalText.trim();
        setText((t) => (t && !t.endsWith("\n") && !cleaned.startsWith("\n") ? `${t} ${cleaned}` : t + cleaned));
      }
      setInterim(interimText);
    };
    r.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      wantListening.current = false;
      setError(ERRORS[event.error] ?? `Speech recognition stopped (${event.error}).`);
    };
    // Browsers end recognition after a pause; restart while the user still wants to dictate.
    r.onend = () => {
      setInterim("");
      if (wantListening.current) {
        try { r.start(); return; } catch { /* fall through */ }
      }
      setListening(false);
    };
    recognition.current = r;
    wantListening.current = true;
    r.start();
    setListening(true);
  };
  const stop = () => {
    wantListening.current = false;
    recognition.current?.stop();
    setListening(false);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (!supported) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <h2 className="font-semibold">Your browser doesn&apos;t support speech recognition</h2>
        <p className="mt-2 text-sm">Open this page in Google Chrome, Microsoft Edge or Safari. Firefox doesn&apos;t include speech recognition yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6" aria-label="Dictation">
        <div className="flex flex-wrap items-end gap-4">
          <SelectField label="Language you'll speak" value={lang} onChange={setLang} className="w-64" options={LANGUAGES.map(([value, label]) => ({ value, label }))} />
          {lang.startsWith("en") && <CheckboxField label={'Voice commands ("new line", "comma", "full stop")'} checked={commands} onChange={setCommands} className="pb-2" />}
        </div>
        <div className="flex flex-col items-center gap-3 py-2">
          <button type="button" onClick={listening ? stop : start} aria-pressed={listening}
            className={cn("flex size-24 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95", listening ? "animate-pulse bg-destructive" : "bg-brand hover:scale-105")}>
            {listening ? <MicOff className="size-10" aria-hidden /> : <Mic className="size-10" aria-hidden />}
            <span className="sr-only">{listening ? "Stop listening" : "Start listening"}</span>
          </button>
          <p className="text-sm font-medium" aria-live="polite">{listening ? "Listening… speak now" : "Tap the microphone and start speaking"}</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      </section>
      <section className="space-y-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6" aria-label="Transcript">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Transcript <span className="text-sm font-normal text-muted-foreground">· {words} {words === 1 ? "word" : "words"}</span></h2>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={text} label="Copy text" saveable={false} />
            <Button variant="outline" size="lg" disabled={!text} onClick={download}><Download /> Download .txt</Button>
            <Button variant="ghost" size="lg" disabled={!text} onClick={() => setText("")}><Trash2 /> Clear</Button>
          </div>
        </div>
        <label htmlFor="stt-text" className="sr-only">Transcript</label>
        <textarea id="stt-text" value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder="Your words appear here. You can edit the text at any time."
          className="w-full resize-y rounded-lg border bg-background p-3 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        {interim && <p className="text-sm italic text-muted-foreground" aria-hidden>{interim}</p>}
        <p className="text-xs text-muted-foreground">Speech recognition is done by your browser&apos;s speech service — Chrome and Edge send the audio to Google or Microsoft to transcribe it. We don&apos;t receive or store your audio or text.</p>
      </section>
    </div>
  );
}
