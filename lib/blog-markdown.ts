import { Marked, type Tokens } from "marked";

const ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ESCAPE[c]);

/** Only web, mail and on-site links — never javascript:, data: or other schemes. */
export function safeUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  const url = href.trim();
  if (/^(https?:|mailto:)/i.test(url) || /^[/#?]/.test(url)) return url;
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return null;
  return url; // relative path like "gst-calculator"
}

// Raw HTML in the Markdown is shown as text, and link/image URLs are filtered, so a post can't inject script.
const marked = new Marked({
  gfm: true,
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }: Tokens.Link) {
      const label = this.parser.parseInline(tokens);
      const url = safeUrl(href);
      if (!url) return label;
      const external = /^https?:/i.test(url);
      return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""}>${label}</a>`;
    },
    image({ href, title, text }: Tokens.Image) {
      const url = safeUrl(href);
      if (!url || /^mailto:/i.test(url)) return escapeHtml(text);
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy" />`;
    },
  },
});

/** Markdown → safe HTML for blog posts (used on the server and in the editor preview). */
export function renderBlogMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false });
}

/** Headings (## and ###) for a table of contents and search. */
export function markdownHeadings(markdown: string) {
  return [...markdown.matchAll(/^(#{2,3})\s+(.+?)\s*#*\s*$/gm)].map((m) => ({ level: m[1].length, text: m[2].replace(/[*_`[\]]/g, "") }));
}

export function readingMinutes(markdown: string) {
  const words = markdown.replace(/[#>*_`[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}
