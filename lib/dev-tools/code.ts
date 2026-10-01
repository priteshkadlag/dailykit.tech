/** Formatting, minifying, encoding and decoding helpers for the developer tools. */

export type Result<T = string> = { ok: true; value: T } | { ok: false; error: string };

// ---- JSON

/** Line and column (1-based) of a character offset. */
export function lineColumn(text: string, offset: number) {
  const before = text.slice(0, offset).split("\n");
  return { line: before.length, column: before[before.length - 1].length + 1 };
}

/** JSON.parse with an error message that names the line and column. */
export function parseJson(text: string): Result<unknown> {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const position = /position (\d+)/.exec(message);
    const lineCol = /line (\d+) column (\d+)/.exec(message);
    const where = lineCol ? { line: Number(lineCol[1]), column: Number(lineCol[2]) } : position ? lineColumn(text, Number(position[1])) : null;
    const reason = message.replace(/^JSON\.parse: /, "").replace(/ in JSON at position \d+.*$/, "").replace(/ at line \d+ column \d+.*$/, "");
    return { ok: false, error: where ? `Line ${where.line}, column ${where.column}: ${reason}` : reason };
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]));
  }
  return value;
}

export function formatJson(text: string, indent: number | "\t" = 2, sort = false): Result {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(sort ? sortKeys(parsed.value) : parsed.value, null, indent) };
}

export function minifyJson(text: string): Result {
  const parsed = parseJson(text);
  return parsed.ok ? { ok: true, value: JSON.stringify(parsed.value) } : parsed;
}

// ---- XML

interface XmlToken {
  kind: "open" | "close" | "self" | "text" | "other";
  name?: string;
  raw: string;
  offset: number;
}

const XML_TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE(?:[^[>]|\[[\s\S]*?\])*>|<\/?[^>]*>|[^<]+|</gi;

function tokenizeXml(text: string): Result<XmlToken[]> {
  const tokens: XmlToken[] = [];
  for (const match of text.matchAll(XML_TOKEN)) {
    const raw = match[0];
    const offset = match.index;
    const where = () => { const at = lineColumn(text, offset); return `Line ${at.line}, column ${at.column}`; };
    if (raw === "<") return { ok: false, error: `${where()}: a "<" that doesn't start a tag. Write it as &lt; in text.` };
    if (raw.startsWith("<!--") || raw.startsWith("<![CDATA[") || raw.startsWith("<?") || /^<!DOCTYPE/i.test(raw)) {
      tokens.push({ kind: "other", raw, offset });
    } else if (raw.startsWith("</")) {
      const name = /^<\/\s*([^\s>]+)\s*>$/.exec(raw)?.[1];
      if (!name) return { ok: false, error: `${where()}: malformed closing tag ${raw}` };
      tokens.push({ kind: "close", name, raw, offset });
    } else if (raw.startsWith("<")) {
      const tag = /^<([A-Za-z_:][\w:.-]*)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>$/.exec(raw);
      if (!tag) return { ok: false, error: `${where()}: malformed tag ${raw.length > 60 ? `${raw.slice(0, 60)}…` : raw} (attribute values must be quoted)` };
      tokens.push({ kind: tag[3] ? "self" : "open", name: tag[1], raw, offset });
    } else {
      tokens.push({ kind: "text", raw, offset });
    }
  }
  return { ok: true, value: tokens };
}

/** Checks that XML is well-formed: tags nest and close, attributes are quoted, one root element. */
export function validateXml(text: string): Result<XmlToken[]> {
  const tokens = tokenizeXml(text);
  if (!tokens.ok) return tokens;
  const stack: XmlToken[] = [];
  let roots = 0;
  for (const token of tokens.value) {
    const where = () => { const at = lineColumn(text, token.offset); return `Line ${at.line}, column ${at.column}`; };
    if ((token.kind === "open" || token.kind === "self") && stack.length === 0) roots++;
    if (token.kind === "text" && stack.length === 0 && token.raw.trim()) return { ok: false, error: `${where()}: text outside the root element.` };
    if (token.kind === "open") stack.push(token);
    if (token.kind === "close") {
      const open = stack.pop();
      if (!open) return { ok: false, error: `${where()}: closing tag </${token.name}> has no matching opening tag.` };
      if (open.name !== token.name) return { ok: false, error: `${where()}: expected </${open.name}> but found </${token.name}>.` };
    }
  }
  if (stack.length) {
    const at = lineColumn(text, stack[stack.length - 1].offset);
    return { ok: false, error: `Line ${at.line}, column ${at.column}: <${stack[stack.length - 1].name}> is never closed.` };
  }
  if (roots === 0) return { ok: false, error: "No root element found." };
  if (roots > 1) return { ok: false, error: "XML must have exactly one root element." };
  return tokens;
}

export function formatXml(text: string, indent = "  "): Result {
  const tokens = validateXml(text);
  if (!tokens.ok) return tokens;
  const lines: string[] = [];
  let depth = 0;
  const list = tokens.value.filter((token) => token.kind !== "text" || token.raw.trim());
  for (let i = 0; i < list.length; i++) {
    const token = list[i];
    const pad = indent.repeat(depth);
    if (token.kind === "open") {
      // Keep <a>text</a> on one line.
      const next = list[i + 1];
      const after = list[i + 2];
      if (next?.kind === "text" && after?.kind === "close" && after.name === token.name) {
        lines.push(pad + token.raw + next.raw.trim() + after.raw);
        i += 2;
        continue;
      }
      if (next?.kind === "close" && next.name === token.name) {
        lines.push(pad + token.raw + next.raw);
        i += 1;
        continue;
      }
      lines.push(pad + token.raw);
      depth++;
    } else if (token.kind === "close") {
      depth--;
      lines.push(indent.repeat(depth) + token.raw);
    } else {
      lines.push(pad + (token.kind === "text" ? token.raw.trim() : token.raw));
    }
  }
  return { ok: true, value: lines.join("\n") };
}

export function minifyXml(text: string): Result {
  const tokens = validateXml(text);
  if (!tokens.ok) return tokens;
  return { ok: true, value: tokens.value.filter((t) => !t.raw.startsWith("<!--")).map((t) => (t.kind === "text" ? t.raw.trim() : t.raw)).join("") };
}

const XML_ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: "\"", apos: "'" };
const decodeXmlText = (text: string) => text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, ref: string) => {
  if (ref[0] === "#") {
    const code = ref[1].toLowerCase() === "x" ? parseInt(ref.slice(2), 16) : Number(ref.slice(1));
    return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  }
  return XML_ENTITIES[ref] ?? whole;
});
const XML_ATTR = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const coerce = (value: string): unknown => (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : value === "true" ? true : value === "false" ? false : value);

interface XmlNode { name: string; attrs: [string, string][]; children: XmlNode[]; text: string }

/**
 * Converts well-formed XML to JSON: attributes become "@name" keys, an element's text becomes "#text"
 * when it also has attributes or child elements, and repeated child elements become arrays.
 */
export function xmlToJson(text: string, { types = true, attrPrefix = "@" } = {}): Result<unknown> {
  const tokens = validateXml(text);
  if (!tokens.ok) return tokens;
  const root: XmlNode = { name: "", attrs: [], children: [], text: "" };
  const stack = [root];
  for (const token of tokens.value) {
    const parent = stack[stack.length - 1];
    if (token.kind === "open" || token.kind === "self") {
      const attrs = [...token.raw.slice(token.name!.length + 1).matchAll(XML_ATTR)].map((m): [string, string] => [m[1], decodeXmlText(m[2] ?? m[3])]);
      const node: XmlNode = { name: token.name!, attrs, children: [], text: "" };
      parent.children.push(node);
      if (token.kind === "open") stack.push(node);
    } else if (token.kind === "close") stack.pop();
    else if (token.kind === "text") parent.text += decodeXmlText(token.raw);
    else if (token.raw.startsWith("<![CDATA[")) parent.text += token.raw.slice(9, -3);
  }
  const value = (raw: string) => (types ? coerce(raw) : raw);
  const convert = (node: XmlNode): unknown => {
    const textValue = node.text.trim();
    if (!node.attrs.length && !node.children.length) return textValue ? value(textValue) : null;
    const out: Record<string, unknown> = {};
    for (const [name, attr] of node.attrs) out[attrPrefix + name] = value(attr);
    for (const child of node.children) {
      const converted = convert(child);
      // convert() never returns an array, so an existing array means the element repeated.
      const existing = out[child.name];
      if (!(child.name in out)) out[child.name] = converted;
      else if (Array.isArray(existing)) existing.push(converted);
      else out[child.name] = [existing, converted];
    }
    if (textValue) out["#text"] = value(textValue);
    return out;
  };
  const top = root.children[0];
  return { ok: true, value: { [top.name]: convert(top) } };
}

// ---- CSS

/** Minifies CSS without touching strings, url() contents or the spaces calc() needs. */
export function minifyCss(css: string): string {
  let out = "";
  let i = 0;
  let calcDepth = 0;
  let parenDepth = 0;
  const calcStarts: number[] = [];
  while (i < css.length) {
    const ch = css[i];
    // Comments (keep /*! licence comments).
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const comment = css.slice(i, end < 0 ? css.length : end + 2);
      if (comment.startsWith("/*!")) out += comment;
      i += comment.length;
      continue;
    }
    // Strings.
    if (ch === "\"" || ch === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== ch) j += css[j] === "\\" ? 2 : 1;
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    // url(...) without quotes is copied verbatim.
    if (/^url\(/i.test(css.slice(i, i + 4)) && !/["']/.test(css.slice(i + 4).trimStart()[0] ?? "")) {
      const end = css.indexOf(")", i);
      out += css.slice(i, end + 1).replace(/^url\(\s*/i, "url(").replace(/\s*\)$/, ")");
      i = end + 1;
      continue;
    }
    if (/\s/.test(ch)) {
      let j = i;
      while (j < css.length && /\s/.test(css[j])) j++;
      const prev = out[out.length - 1] ?? "";
      const next = css[j] ?? "";
      // Inside calc(), + and - need their spaces.
      const keep = calcDepth > 0 ? !/[(,*/]/.test(prev) && !/[),*/]/.test(next) : !/[{}:;,>~+(]/.test(prev) && !/[{}:;,>~+)!]/.test(next);
      if (keep && out.length && next && !out.endsWith("*/")) out += " ";
      i = j;
      continue;
    }
    if (ch === "(") {
      parenDepth++;
      if (/(?:calc|clamp|min|max)$/i.test(out) || calcDepth > 0) { calcDepth++; calcStarts.push(parenDepth); }
    }
    if (ch === ")") {
      if (calcStarts[calcStarts.length - 1] === parenDepth) { calcStarts.pop(); calcDepth--; }
      parenDepth--;
    }
    // Drop the semicolon before a closing brace.
    if (ch === "}" && out.endsWith(";")) out = out.slice(0, -1);
    out += ch;
    i++;
  }
  return out.trim();
}

// ---- HTML

const HTML_RAW = /<(pre|textarea|script|style)\b[\s\S]*?<\/\1\s*>/gi;

/** Removes comments and collapses whitespace, leaving pre/textarea/script/style blocks alone. */
export function minifyHtml(html: string, { removeComments = true } = {}): string {
  const kept: string[] = [];
  let text = html.replace(HTML_RAW, (block) => { kept.push(block); return `\u0000${kept.length - 1}\u0000`; });
  // Conditional comments (<!--[if IE]>) are kept.
  if (removeComments) text = text.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");
  text = text
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, (match) => (/\S/.test(match.slice(1, -1)) ? match : "> <"))
    // Whitespace between block-level tags doesn't render.
    .replace(/\s*(<\/?(?:html|head|body|div|p|ul|ol|li|table|thead|tbody|tr|td|th|section|article|header|footer|nav|main|aside|h[1-6]|meta|link|title|br|hr|form|fieldset|figure|figcaption|!DOCTYPE)\b[^>]*>)\s*/gi, "$1")
    .trim();
  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => kept[Number(index)]);
}

// ---- Size

export function byteSize(text: string) {
  return new TextEncoder().encode(text).length;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---- Base64

export function base64Encode(text: string, urlSafe = false) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
}

export function base64ToBytes(input: string): Result<Uint8Array> {
  let clean = input.replace(/^data:[^,]*,/, "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) return { ok: false, error: "This isn't valid Base64: it contains characters outside A–Z, a–z, 0–9, +, / and =." };
  clean = clean.padEnd(Math.ceil(clean.length / 4) * 4, "=");
  try {
    const binary = atob(clean);
    return { ok: true, value: Uint8Array.from(binary, (c) => c.charCodeAt(0)) };
  } catch {
    return { ok: false, error: "This isn't valid Base64." };
  }
}

export function base64Decode(input: string): Result {
  const bytes = base64ToBytes(input);
  if (!bytes.ok) return bytes;
  try {
    return { ok: true, value: new TextDecoder("utf-8", { fatal: true }).decode(bytes.value) };
  } catch {
    return { ok: false, error: "Decoded fine, but the result isn't UTF-8 text — it's probably a binary file such as an image." };
  }
}

// ---- URL encoding

export function urlEncode(text: string, mode: "component" | "uri", formSpaces = false) {
  const encoded = mode === "component" ? encodeURIComponent(text) : encodeURI(text);
  return formSpaces ? encoded.replace(/%20/g, "+") : encoded;
}

export function urlDecode(text: string, formSpaces = false): Result {
  try {
    return { ok: true, value: decodeURIComponent(formSpaces ? text.replace(/\+/g, " ") : text) };
  } catch {
    return { ok: false, error: "The text contains a % sequence that isn't valid percent-encoding, such as a lone % or %zz." };
  }
}

// ---- HTML entities

const ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

export function encodeEntities(text: string, { nonAscii = false, named = true } = {}) {
  let out = text.replace(/[&<>"']/g, (c) => ESCAPE[c]);
  if (nonAscii) out = out.replace(/[^\x00-\x7f]/gu, (c) => (named && NAMED_REVERSE[c] ? `&${NAMED_REVERSE[c]};` : `&#${c.codePointAt(0)};`));
  return out;
}

/** Common named entities; the browser's parser covers the rest when available. */
const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: "\u00a0", copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", bull: "•", middot: "·", deg: "°", plusmn: "±", times: "×", divide: "÷", euro: "€", pound: "£",
  yen: "¥", cent: "¢", sect: "§", para: "¶", laquo: "«", raquo: "»", larr: "←", rarr: "→", uarr: "↑", darr: "↓", harr: "↔", hearts: "♥",
  frac12: "½", frac14: "¼", frac34: "¾", sup2: "²", sup3: "³", micro: "µ", eacute: "é", egrave: "è", aacute: "á", agrave: "à", ccedil: "ç",
  ntilde: "ñ", ouml: "ö", uuml: "ü", auml: "ä", szlig: "ß", iexcl: "¡", iquest: "¿", infin: "∞", ne: "≠", le: "≤", ge: "≥", check: "✓",
};
const NAMED_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(NAMED).filter(([name]) => !["amp", "lt", "gt", "quot", "apos"].includes(name)).map(([k, v]) => [v, k]));

export function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    if (NAMED[body]) return NAMED[body];
    if (typeof DOMParser !== "undefined") {
      // The HTML parser knows every named entity; parsing text this way runs no scripts.
      const decoded = new DOMParser().parseFromString(`<!doctype html><body>${match}`, "text/html").body.textContent;
      if (decoded && decoded !== match) return decoded;
    }
    return match;
  });
}

// ---- JWT

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  /** Registered time claims, as dates. */
  times: { claim: "iat" | "nbf" | "exp"; date: Date }[];
  expired: boolean | null;
}

export function decodeJwt(token: string, now = Date.now()): Result<DecodedJwt> {
  const parts = token.trim().replace(/^Bearer\s+/i, "").split(".");
  if (parts.length !== 3) return { ok: false, error: `A JWT has three parts separated by dots; this has ${parts.length}.` };
  const part = (index: number, name: string): Result<Record<string, unknown>> => {
    const text = base64Decode(parts[index]);
    if (!text.ok) return { ok: false, error: `The ${name} isn't valid Base64URL.` };
    const json = parseJson(text.value);
    if (!json.ok || typeof json.value !== "object" || json.value === null) return { ok: false, error: `The ${name} isn't a JSON object.` };
    return { ok: true, value: json.value as Record<string, unknown> };
  };
  const header = part(0, "header");
  if (!header.ok) return header;
  const payload = part(1, "payload");
  if (!payload.ok) return payload;
  const times = (["iat", "nbf", "exp"] as const)
    .filter((claim) => typeof payload.value[claim] === "number")
    .map((claim) => ({ claim, date: new Date((payload.value[claim] as number) * 1000) }));
  const exp = payload.value.exp;
  return { ok: true, value: { header: header.value, payload: payload.value, signature: parts[2], times, expired: typeof exp === "number" ? exp * 1000 < now : null } };
}
