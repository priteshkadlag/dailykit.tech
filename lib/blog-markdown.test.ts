import { describe, expect, it } from "vitest";
import { markdownHeadings, readingMinutes, renderBlogMarkdown, safeUrl, slugify } from "@/lib/blog-markdown";

describe("blog markdown", () => {
  it("renders GitHub-flavoured markdown", () => {
    const html = renderBlogMarkdown("## Title\n\n- one\n- **two**\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<h2");
    expect(html).toContain("<strong>two</strong>");
    expect(html).toContain("<table>");
  });
  it("escapes raw HTML and blocks script URLs", () => {
    const html = renderBlogMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1)) ![i](data:image/svg+xml,abc) <img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:image");
    expect(html).toContain("&lt;script&gt;");
  });
  it("opens external links safely", () => {
    expect(renderBlogMarkdown("[GST](/gst-calculator)")).toContain('<a href="/gst-calculator">');
    expect(renderBlogMarkdown("[x](https://example.com)")).toContain('rel="noopener noreferrer nofollow"');
  });
  it("filters URLs", () => {
    expect(safeUrl("https://a.com")).toBe("https://a.com");
    expect(safeUrl("/blog")).toBe("/blog");
    expect(safeUrl("JavaScript:alert(1)")).toBeNull();
    expect(safeUrl("vbscript:x")).toBeNull();
  });
  it("extracts headings, reading time and slugs", () => {
    expect(markdownHeadings("# H1\n## Why **GST**\n### Steps\n")).toEqual([{ level: 2, text: "Why GST" }, { level: 3, text: "Steps" }]);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
    expect(slugify("  How to File GST Returns — 2026 Guide! ")).toBe("how-to-file-gst-returns-2026-guide");
    expect(slugify("Café résumé")).toBe("cafe-resume");
  });
});
