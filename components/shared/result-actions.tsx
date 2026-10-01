"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Check, Copy, Download, Loader2, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics/client";
import { newId } from "@/lib/storage/local-collection";
import { savedCalculationsStore } from "@/lib/sync/stores";
import { showSaveError } from "./save-error";
import { Button } from "@/components/ui/button";

const actionClass = "h-10 px-3.5";

/** Copy a calculator result; also offers to keep it in "Recent calculations" (pass saveable={false} to hide). */
export function CopyButton({ text, label = "Copy result", saveable = true }: { text: string; label?: string; saveable?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
    <Button
      type="button"
      variant="outline"
      className={actionClass}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied to clipboard.");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Couldn't copy — your browser blocked clipboard access.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {label}
    </Button>
    {saveable && <SaveCalculationButton text={text} />}
    </>
  );
}

/** Keep this result in "Recent calculations" (dashboard). Saving the same text again is a no-op. */
export function SaveCalculationButton({ text }: { text: string }) {
  const [savedText, setSavedText] = useState<string | null>(null);
  const saved = savedText === text;
  return (
    <Button
      type="button"
      variant="outline"
      className={actionClass}
      disabled={saved}
      onClick={async () => {
        const { pathname, search } = window.location;
        try {
          await savedCalculationsStore.upsert({ id: newId(), toolSlug: pathname.split("/")[1] ?? "", summary: text.slice(0, 2000), url: `${pathname}${search}`, createdAt: new Date().toISOString() });
          setSavedText(text);
          toast.success("Saved to Recent calculations.", {
            description: savedCalculationsStore.mode() === "cloud" ? "Saved to your account." : "Saved on this device.",
          });
        } catch (error) {
          showSaveError(error);
        }
      }}
    >
      {saved ? <BookmarkCheck /> : <Bookmark />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

export function DownloadPdfButton({ onDownload, label = "Download PDF" }: { onDownload: () => Promise<void>; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className={actionClass}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onDownload();
          toast.success("PDF downloaded successfully.");
          track("pdf_generated");
        } catch {
          toast.error("Couldn't generate the PDF. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      {label}
    </Button>
  );
}

export function ShareButton({ title, text }: { title: string; text: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className={actionClass}
      onClick={async () => {
        const url = window.location.href.split("#")[0];
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url });
          } catch {
            // User dismissed the share sheet — nothing to report.
          }
          return;
        }
        try {
          await navigator.clipboard.writeText(`${text}\n\n${url}`);
          toast.success("Result and link copied — paste it anywhere to share.");
        } catch {
          toast.error("Sharing isn't available in this browser.");
        }
      }}
    >
      <Share2 />
      Share
    </Button>
  );
}

export function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <Button type="button" variant="ghost" className={actionClass} onClick={onReset}>
      <RotateCcw />
      Reset
    </Button>
  );
}
