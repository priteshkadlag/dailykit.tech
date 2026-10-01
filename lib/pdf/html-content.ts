/**
 * Prepare HTML from a file or paste for rendering into a PDF inside the app's own page: scripts and
 * active content are removed, nothing is fetched from the network (only embedded data: images are
 * kept), and the document's CSS is scoped so it can't restyle the rest of the site.
 */

const DROP = "script, noscript, iframe, frame, frameset, object, embed, applet, link, meta, base, template, portal";
const URL_ATTRS = ["src", "href", "poster", "background", "action", "formaction", "xlink:href", "data"];

const isSafeResource = (value: string) => /^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp|avif);/i.test(value.trim());

/** Replace every url(...) that isn't an embedded image, so styles can't trigger network requests. */
const stripUrls = (css: string) => css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (m, _q, u: string) => (isSafeResource(u) ? m : "none"));

function scopeSelector(selector: string, scope: string) {
  const s = selector.trim();
  if (!s) return "";
  const root = /^(:root|html)(\s+body)?|^body/;
  return root.test(s) ? s.replace(root, scope) : `${scope} ${s}`;
}

function scopeRules(rules: CSSRuleList, scope: string): string {
  let out = "";
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      const selectors = rule.selectorText.split(",").map((s) => scopeSelector(s, scope)).filter(Boolean).join(", ");
      if (selectors) out += `${selectors} { ${stripUrls(rule.style.cssText)} }\n`;
    } else if (rule instanceof CSSMediaRule) {
      // Print styles are what a PDF should use; screen-only rules are dropped.
      const media = rule.conditionText;
      if (/\bprint\b/.test(media) || !/\bscreen\b/.test(media)) out += `@media ${media.replace(/\bprint\b/g, "all")} { ${scopeRules(rule.cssRules, scope)} }\n`;
    } else if (rule instanceof CSSSupportsRule) {
      out += `@supports ${rule.conditionText} { ${scopeRules(rule.cssRules, scope)} }\n`;
    } else if (rule instanceof CSSKeyframesRule) {
      out += `${rule.cssText}\n`;
    }
    // @import and @font-face would load files from the web: left out.
  }
  return out;
}

/** Scope a style sheet's rules under `scope` (e.g. ".doc-123"). Invalid CSS is skipped. */
export function scopeCss(css: string, scope: string): string {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return scopeRules(sheet.cssRules, scope);
  } catch {
    return "";
  }
}

export interface PreparedHtml {
  /** Scoped CSS from the document's own <style> blocks. */
  css: string;
  body: string;
  title: string;
}

export function prepareHtml(html: string, scope: string): PreparedHtml {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const css = [...doc.querySelectorAll("style")].map((s) => scopeCss(s.textContent ?? "", scope)).join("\n");
  doc.querySelectorAll("style").forEach((s) => s.remove());
  doc.querySelectorAll(DROP).forEach((el) => el.remove());

  for (const el of doc.body.querySelectorAll("*")) {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "srcset" || name === "srcdoc" || name === "ping") el.removeAttribute(attr.name);
      else if (name === "style") el.setAttribute("style", stripUrls(attr.value));
      else if (URL_ATTRS.includes(name)) {
        // Links can stay as text targets, but never scripts; resources must be embedded.
        if (name === "href") {
          if (/^\s*(javascript|vbscript|data):/i.test(attr.value)) el.removeAttribute(attr.name);
        } else if (!isSafeResource(attr.value)) el.removeAttribute(attr.name);
      }
    }
  }
  // An <img> without a usable source would show a broken-image icon.
  doc.body.querySelectorAll("img:not([src])").forEach((img) => img.remove());
  const bodyStyle = doc.body.getAttribute("style");
  return { css: css + (bodyStyle ? `\n${scope} { ${stripUrls(bodyStyle)} }` : ""), body: doc.body.innerHTML, title: doc.title.trim() };
}

let counter = 0;

/** A ready-to-stage element holding the HTML with its scoped styles and a base stylesheet. */
export function buildDocument(body: string, { css = "", base = BASE_CSS }: { css?: string; base?: (scope: string) => string } = {}) {
  const scope = `pdfdoc-${++counter}`;
  const root = document.createElement("div");
  root.className = scope;
  root.innerHTML = `<style>${base(`.${scope}`)}\n${css.replaceAll("__SCOPE__", `.${scope}`)}</style>${body}`;
  return { root, scope: `.${scope}` };
}

/** Neutral defaults for pasted or uploaded web pages — the page's own CSS comes after and wins. */
export const BASE_CSS = (s: string) => `
${s} { font-family: Arial, "Helvetica Neue", "Noto Sans", "Nirmala UI", sans-serif; font-size: 12pt; line-height: 1.45; color: #111; background: #fff; overflow-wrap: anywhere; }
${s} img, ${s} svg, ${s} video { max-width: 100%; height: auto; }
${s} table { border-collapse: collapse; max-width: 100%; }
${s} pre { white-space: pre-wrap; }
`;

/** Word-processor look for converted .docx files (mammoth gives clean, unstyled HTML). */
export const DOC_CSS = (s: string) => `
${BASE_CSS(s)}
${s} { font-family: Calibri, Carlito, Arial, "Noto Sans", "Nirmala UI", sans-serif; font-size: 11pt; line-height: 1.4; }
${s} h1 { font-size: 20pt; margin: 0 0 10pt; } ${s} h2 { font-size: 16pt; margin: 14pt 0 8pt; } ${s} h3 { font-size: 13pt; margin: 12pt 0 6pt; }
${s} h4, ${s} h5, ${s} h6 { font-size: 11pt; margin: 10pt 0 4pt; }
${s} p { margin: 0 0 8pt; } ${s} ul, ${s} ol { margin: 0 0 8pt; padding-left: 22pt; } ${s} li { margin: 0 0 3pt; }
${s} table { width: 100%; margin: 0 0 10pt; } ${s} td, ${s} th { border: 1px solid #999; padding: 4pt 6pt; vertical-align: top; text-align: left; }
${s} th { background: #f2f2f2; } ${s} td p, ${s} th p { margin: 0; }
${s} blockquote { margin: 0 0 8pt 18pt; color: #444; } ${s} a { color: #1155cc; }
`;

/** Spreadsheet look: compact grid, numbers right-aligned by the converter. */
export const SHEET_CSS = (s: string) => `
${BASE_CSS(s)}
${s} { font-size: 9pt; line-height: 1.3; }
${s} h2 { font-size: 13pt; margin: 0 0 6pt; }
${s} section + section { margin-top: 18pt; }
${s} table { border-collapse: collapse; }
${s} td, ${s} th { border: 1px solid #bbb; padding: 2pt 5pt; white-space: nowrap; vertical-align: top; }
${s} tr:first-child td { background: #f2f2f2; font-weight: 600; }
${s} td[data-t="n"] { text-align: right; font-variant-numeric: tabular-nums; }
`;
