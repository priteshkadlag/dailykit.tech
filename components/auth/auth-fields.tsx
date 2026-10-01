"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  autoFocus?: boolean;
  /** Link shown at the right of the label, e.g. "Forgot password?". */
  aside?: React.ReactNode;
}

/** Uncontrolled field for server-action forms. Passwords get a show/hide toggle. */
export function AuthField({ label, name, type = "text", autoComplete, defaultValue, error, hint, required = true, autoFocus, aside }: AuthFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = error || hint ? `${id}-msg` : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {aside}
      </div>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("h-11 bg-background text-base md:text-base", isPassword && "pr-11")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function FormMessage({ message, tone = "error" }: { message?: string; tone?: "error" | "success" }) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg px-3 py-2.5 text-sm", tone === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-800")}
    >
      {message}
    </p>
  );
}
