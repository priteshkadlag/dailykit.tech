"use client";

import { Plus, Trash2 } from "lucide-react";
import type { HttpRequestSpec } from "@/lib/dev-tools/generate";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea } from "@/components/dev-tools/shared";

type Header = { name: string; value: string };
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

export function RequestFields({ spec, setSpec }: { spec: HttpRequestSpec; setSpec: (update: (s: HttpRequestSpec) => HttpRequestSpec) => void }) {
  const setHeader = (index: number, key: keyof Header) => (value: string) => setSpec((s) => ({ ...s, headers: s.headers.map((h, i) => (i === index ? { ...h, [key]: value } : h)) }));
  const auth = spec.auth ?? { type: "none" };
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
        <SelectField label="Method" value={spec.method} onChange={(method) => setSpec((s) => ({ ...s, method }))} options={METHODS.map((m) => ({ value: m, label: m }))} />
        <TextField label="URL" value={spec.url} onChange={(url) => setSpec((s) => ({ ...s, url }))} placeholder="https://api.example.com/items" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Headers</p>
        {spec.headers.map((header, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] items-end gap-2">
            <TextField label={`Header ${i + 1} name`} value={header.name} onChange={setHeader(i, "name")} placeholder="Content-Type" />
            <TextField label="Value" value={header.value} onChange={setHeader(i, "value")} placeholder="application/json" />
            <Button variant="ghost" size="icon-lg" aria-label={`Remove header ${i + 1}`} onClick={() => setSpec((s) => ({ ...s, headers: s.headers.filter((_, j) => j !== i) }))}><Trash2 /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => setSpec((s) => ({ ...s, headers: [...s.headers, { name: "", value: "" }] }))}><Plus /> Add header</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField label="Authentication" value={auth.type} onChange={(type) => setSpec((s) => ({ ...s, auth: { ...auth, type } }))} options={[{ value: "none", label: "None" }, { value: "bearer", label: "Bearer token" }, { value: "basic", label: "Basic (user & password)" }]} />
        {auth.type === "bearer" && <TextField label="Token" value={auth.token ?? ""} onChange={(token) => setSpec((s) => ({ ...s, auth: { ...auth, token } }))} className="sm:col-span-2" />}
        {auth.type === "basic" && <><TextField label="Username" value={auth.username ?? ""} onChange={(username) => setSpec((s) => ({ ...s, auth: { ...auth, username } }))} /><TextField label="Password" type="password" value={auth.password ?? ""} onChange={(password) => setSpec((s) => ({ ...s, auth: { ...auth, password } }))} /></>}
      </div>
      {!["GET", "HEAD"].includes(spec.method) && <CodeArea label="Body" value={spec.body} onChange={(body) => setSpec((s) => ({ ...s, body }))} rows={6} placeholder='{"name": "Asha"}' />}
    </>
  );
}
