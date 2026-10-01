"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bold, Code, ExternalLink, Heading2, Heading3, Image as ImageIcon, Italic, Link2, List, ListOrdered, Loader2, Minus, Quote, Send, Save, Table, Trash2, Wrench, X,
} from "lucide-react";
import { deleteBlogPostAction, saveBlogPostAction, type BlogPostInput } from "@/lib/admin/blog-actions";
import { blogCategories } from "@/lib/blog";
import { markdownHeadings, readingMinutes, renderBlogMarkdown, slugify } from "@/lib/blog-markdown";
import { liveTools } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EditorPost {
  id?: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  description: string;
  content: string;
  tags: string[];
  relatedTools: string[];
  featured: boolean;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string;
}

export const EMPTY_POST: EditorPost = {
  title: "", slug: "", category: "business", excerpt: "", description: "",
  content: "## Introduction\n\nStart writing here. Use the toolbar for headings, lists, links and tables.\n",
  tags: [], relatedTools: [], featured: false, status: "DRAFT", publishedAt: "",
};

type View = "write" | "preview" | "split";
type Action = { wrap: [string, string, string]; block?: boolean } | { prefix: string; placeholder: string };
const TOOLBAR: { icon: React.ComponentType<{ className?: string }>; label: string; action: Action }[] = [
  { icon: Heading2, label: "Heading", action: { prefix: "## ", placeholder: "Section heading" } },
  { icon: Heading3, label: "Subheading", action: { prefix: "### ", placeholder: "Subheading" } },
  { icon: Bold, label: "Bold", action: { wrap: ["**", "**", "bold text"] } },
  { icon: Italic, label: "Italic", action: { wrap: ["_", "_", "italic text"] } },
  { icon: Link2, label: "Link", action: { wrap: ["[", "](https://)", "link text"] } },
  { icon: List, label: "Bullet list", action: { prefix: "- ", placeholder: "List item" } },
  { icon: ListOrdered, label: "Numbered list", action: { prefix: "1. ", placeholder: "First step" } },
  { icon: Quote, label: "Quote", action: { prefix: "> ", placeholder: "Quote or key takeaway" } },
  { icon: Code, label: "Code", action: { wrap: ["`", "`", "code"] } },
  { icon: Table, label: "Table", action: { wrap: ["\n| Column | Column |\n|---|---|\n| ", " | Value |\n", "Value"], block: true } },
  { icon: ImageIcon, label: "Image", action: { wrap: ["![", "](https://)", "Describe the image"] } },
  { icon: Minus, label: "Divider", action: { wrap: ["\n---\n", "", ""], block: true } },
];
const field = "w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive";

function Counter({ value, max, ideal }: { value: number; max: number; ideal?: [number, number] }) {
  const good = ideal ? value >= ideal[0] && value <= ideal[1] : value <= max;
  return <span className={cn("text-xs tabular-nums", value > max ? "text-destructive" : good ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>{value}/{max}</span>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;
}

export function BlogEditor({ initial, siteUrl }: { initial: EditorPost; siteUrl: string }) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [view, setView] = useState<View>("split");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagDraft, setTagDraft] = useState("");
  const [toolQuery, setToolQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof EditorPost>(key: K, value: EditorPost[K]) => setPost((p) => ({ ...p, [key]: value }));
  const dirty = JSON.stringify(post) !== JSON.stringify(saved);
  const slug = slugify(post.slug || post.title);
  const html = useMemo(() => renderBlogMarkdown(post.content), [post.content]);
  const headings = useMemo(() => markdownHeadings(post.content), [post.content]);
  const words = post.content.trim() ? post.content.trim().split(/\s+/).length : 0;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Wraps the selection (or inserts a placeholder) in Markdown syntax. */
  const format = (before: string, after = "", placeholder = "text", block = false) => {
    const el = textarea.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || placeholder;
    const lineStart = block && start > 0 && value[start - 1] !== "\n" ? "\n" : "";
    const insert = `${lineStart}${before}${selected}${after}`;
    const next = value.slice(0, start) + insert + value.slice(end);
    set("content", next);
    requestAnimationFrame(() => {
      el.focus();
      const from = start + lineStart.length + before.length;
      el.setSelectionRange(from, from + selected.length);
    });
  };
  const linePrefix = (prefix: string, placeholder: string) => {
    const el = textarea.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || placeholder;
    const lines = selected.split("\n").map((l, i) => (prefix === "1. " ? `${i + 1}. ` : prefix) + l).join("\n");
    const lead = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
    set("content", value.slice(0, start) + lead + lines + value.slice(end));
    requestAnimationFrame(() => el.focus());
  };

  const save = (status: "DRAFT" | "PUBLISHED") => {
    const input: BlogPostInput = { ...post, status, slug: post.slug || post.title, id: post.id };
    startTransition(async () => {
      const result = await saveBlogPostAction(input);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast.error(result.message);
        return;
      }
      setErrors({});
      const next = { ...post, status, id: result.id, slug: result.slug ?? slug };
      setPost(next);
      setSaved(next);
      setSlugTouched(true);
      toast.success(result.message, { action: status === "PUBLISHED" ? { label: "View", onClick: () => window.open(`/blog/${result.slug}`, "_blank") } : undefined });
      if (!post.id && result.id) router.replace(`/admin/blog/${result.id}`);
      else router.refresh();
    });
  };
  const remove = () => {
    if (!post.id || !window.confirm(`Delete "${post.title || "this post"}"? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteBlogPostAction(post.id!);
      if (!result.ok) { toast.error(result.message); return; }
      setSaved(post);
      toast.success(result.message);
      router.replace("/admin/blog");
    });
  };
  const addTag = (raw: string) => {
    const tags = raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tags.length) set("tags", [...new Set([...post.tags, ...tags])].slice(0, 12));
    setTagDraft("");
  };
  const toolMatches = toolQuery.trim()
    ? liveTools.filter((t) => !post.relatedTools.includes(t.slug) && t.name.toLowerCase().includes(toolQuery.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* Main column */}
      <div className="min-w-0 space-y-5">
        <div>
          <label htmlFor="post-title" className="sr-only">Title</label>
          <input id="post-title" value={post.title} aria-invalid={!!errors.title}
            onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", ""); }}
            placeholder="Post title"
            className="w-full rounded-xl border bg-card px-4 py-3 text-2xl font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive sm:text-3xl" />
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">{siteUrl.replace(/^https?:\/\//, "")}/blog/<span className="font-medium text-foreground">{slug || "your-post-url"}</span></p>
            <Counter value={post.title.length} max={160} ideal={[30, 70]} />
          </div>
          <FieldError message={errors.title} />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="post-excerpt" className="text-sm font-medium">Summary <span className="font-normal text-muted-foreground">— shown on cards and under the headline</span></label>
            <Counter value={post.excerpt.length} max={300} ideal={[80, 220]} />
          </div>
          <textarea id="post-excerpt" rows={2} value={post.excerpt} aria-invalid={!!errors.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={cn(field, "resize-y py-2")} placeholder="One or two sentences that tell readers what they'll learn." />
          <FieldError message={errors.excerpt} />
        </div>

        <section aria-label="Article body" className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-1.5">
            <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5">
              {TOOLBAR.map(({ icon: Icon, label, action }) => (
                <button key={label} type="button" title={label} aria-label={label} onClick={() => ("prefix" in action ? linePrefix(action.prefix, action.placeholder) : format(...action.wrap, action.block))} disabled={view === "preview"}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-40"><Icon className="size-4" /></button>
              ))}
            </div>
            <div className="ml-auto flex rounded-lg bg-background p-0.5 ring-1 ring-foreground/10" role="radiogroup" aria-label="Editor view">
              {(["write", "split", "preview"] as const).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)}
                  className={cn("rounded-md px-2.5 py-1 text-xs font-medium capitalize", view === v ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground", v === "split" && "hidden xl:block")}>{v}</button>
              ))}
            </div>
          </div>
          <div className={cn("grid", view === "split" && "xl:grid-cols-2")}>
            {view !== "preview" && (
              <textarea ref={textarea} aria-label="Article content (Markdown)" aria-invalid={!!errors.content} value={post.content} onChange={(e) => set("content", e.target.value)}
                className={cn("min-h-[32rem] w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none", view === "split" && "xl:border-r")}
                spellCheck />
            )}
            {view !== "write" && (
              <div className={cn("max-h-[44rem] min-h-[32rem] overflow-y-auto p-5", view === "split" && "hidden xl:block")}>
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
            <span>{words.toLocaleString("en-IN")} words · {readingMinutes(post.content)} min read · {headings.length} headings</span>
            <span>Markdown supported — **bold**, ## headings, - lists, [links](url), tables</span>
          </div>
        </section>
        <FieldError message={errors.content} />
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
        <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Publish">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Publish</h2>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", saved.status === "PUBLISHED" && saved.id ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200")}>
              {saved.id ? (saved.status === "PUBLISHED" ? "Published" : "Draft") : "New"}{dirty && saved.id ? " · unsaved" : ""}
            </span>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Publish date</span>
            <input type="date" value={post.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className={cn(field, "h-9")} />
            <span className="block text-xs text-muted-foreground">Leave empty for today. A future date schedules the post.</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" disabled={pending} onClick={() => save("DRAFT")}><Save /> {post.status === "PUBLISHED" && saved.id ? "Unpublish" : "Save draft"}</Button>
            <Button size="lg" disabled={pending} onClick={() => save("PUBLISHED")}>{pending ? <Loader2 className="animate-spin" /> : <Send />} {saved.status === "PUBLISHED" && saved.id ? "Update" : "Publish"}</Button>
          </div>
          {saved.id && saved.status === "PUBLISHED" && (
            <Link href={`/blog/${saved.slug}`} target="_blank" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"><ExternalLink className="size-3.5" /> View live post</Link>
          )}
          {Object.keys(errors).length > 0 && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">Please fix the highlighted fields.</p>}
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Details">
          <h2 className="font-semibold">Details</h2>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Category</span>
            <select value={post.category} onChange={(e) => set("category", e.target.value)} aria-invalid={!!errors.category} className={cn(field, "h-9")}>
              {blogCategories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            <FieldError message={errors.category} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">URL slug</span>
            <input value={post.slug} placeholder={slugify(post.title) || "auto-from-title"} aria-invalid={!!errors.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} onBlur={() => post.slug && set("slug", slugify(post.slug))} className={cn(field, "h-9 font-mono")} />
            <FieldError message={errors.slug} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={post.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-primary" />
            Feature on the blog homepage
          </label>
          <div className="space-y-1 text-sm">
            <label htmlFor="post-tags" className="font-medium">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => set("tags", post.tags.filter((x) => x !== t))}><X className="size-3" /></button></span>
              ))}
            </div>
            <input id="post-tags" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagDraft); } }} onBlur={() => tagDraft && addTag(tagDraft)} placeholder="Type a tag, press Enter" className={cn(field, "h-9")} />
            <p className="text-xs text-muted-foreground">Tags help readers find the post in search.</p>
          </div>
        </section>

        <section className="space-y-2 rounded-xl border bg-card p-4" aria-label="Related tools">
          <h2 className="flex items-center gap-1.5 font-semibold"><Wrench className="size-4" /> Related tools</h2>
          <div className="flex flex-wrap gap-1.5">
            {post.relatedTools.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{liveTools.find((t) => t.slug === s)?.name ?? s}<button type="button" aria-label="Remove" onClick={() => set("relatedTools", post.relatedTools.filter((x) => x !== s))}><X className="size-3" /></button></span>
            ))}
          </div>
          {post.relatedTools.length < 6 && (
            <div className="relative">
              <input value={toolQuery} onChange={(e) => setToolQuery(e.target.value)} placeholder="Search tools to link…" aria-label="Search tools to link" className={cn(field, "h-9")} />
              {toolMatches.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
                  {toolMatches.map((t) => <li key={t.slug}><button type="button" onClick={() => { set("relatedTools", [...post.relatedTools, t.slug]); setToolQuery(""); }} className="w-full px-3 py-2 text-left text-sm hover:bg-accent">{t.name}</button></li>)}
                </ul>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Shown as &ldquo;Put this guide into practice&rdquo; buttons.</p>
        </section>

        <section className="space-y-2 rounded-xl border bg-card p-4" aria-label="Search appearance">
          <div className="flex items-center justify-between">
            <label htmlFor="post-description" className="font-semibold">Search description</label>
            <Counter value={post.description.length} max={200} ideal={[110, 160]} />
          </div>
          <textarea id="post-description" rows={3} value={post.description} aria-invalid={!!errors.description} onChange={(e) => set("description", e.target.value)} placeholder="Defaults to the summary. 110–160 characters is ideal." className={cn(field, "resize-y py-2")} />
          <FieldError message={errors.description} />
          <div className="rounded-lg bg-muted/50 p-3 text-xs" aria-label="Search result preview">
            <p className="truncate text-emerald-700 dark:text-emerald-400">{siteUrl.replace(/^https?:\/\//, "")} › blog › {slug || "…"}</p>
            <p className="mt-0.5 line-clamp-1 text-sm font-medium text-blue-700 dark:text-sky-300">{post.title || "Post title"}</p>
            <p className="mt-0.5 line-clamp-2 text-muted-foreground">{post.description || post.excerpt || "Your description appears here."}</p>
          </div>
        </section>

        {post.id && (
          <Button variant="destructive" size="lg" className="w-full" disabled={pending} onClick={remove}><Trash2 /> Delete post</Button>
        )}
      </aside>
    </div>
  );
}
