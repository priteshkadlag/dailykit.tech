import { unzipSync } from "fflate";

/**
 * Read a .pptx and rebuild each slide as absolutely positioned HTML — text boxes, shapes, pictures,
 * tables and backgrounds, in the presentation's own order and colours — ready for pagesToPdf().
 * Charts, SmartArt and effects aren't drawn. Browser-only (uses DOMParser).
 */

/** 914400 EMU per inch ÷ 96 px per inch. */
const EMU_PER_PX = 9525;

type Files = Record<string, Uint8Array>;

interface Xfrm {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Part {
  path: string;
  doc: Document;
  rels: Map<string, string>;
}

const decoder = new TextDecoder();

function parse(files: Files, path: string): Document | null {
  const bytes = files[path];
  if (!bytes) return null;
  const doc = new DOMParser().parseFromString(decoder.decode(bytes), "application/xml");
  return doc.getElementsByTagName("parsererror").length ? null : doc;
}

/** Resolve a relationship target relative to the part that references it. */
function resolvePath(from: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = from.split("/").slice(0, -1);
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

function readRels(files: Files, path: string) {
  const dir = path.split("/").slice(0, -1).join("/");
  const file = path.split("/").pop();
  const doc = parse(files, `${dir}/_rels/${file}.rels`);
  const rels = new Map<string, string>();
  if (!doc) return rels;
  for (const r of doc.getElementsByTagName("Relationship")) {
    if (r.getAttribute("TargetMode") === "External") continue;
    rels.set(r.getAttribute("Id") ?? "", resolvePath(path, r.getAttribute("Target") ?? ""));
  }
  return rels;
}

function loadPart(files: Files, path: string): Part | null {
  const doc = parse(files, path);
  return doc ? { path, doc, rels: readRels(files, path) } : null;
}

/** Direct children with a given qualified name (e.g. "p:sp"). */
const kids = (el: Element | null | undefined, name?: string) => (el ? [...el.children].filter((c) => !name || c.nodeName === name) : []);
const kid = (el: Element | null | undefined, name: string) => kids(el, name)[0] ?? null;
const path = (el: Element | null | undefined, ...names: string[]) => names.reduce<Element | null>((e, n) => kid(e, n), el ?? null);
const num = (el: Element | null | undefined, attr: string) => {
  const v = el?.getAttribute(attr);
  return v == null || v === "" ? undefined : Number(v);
};

function readXfrm(el: Element | null): Xfrm | null {
  const off = kid(el, "a:off");
  const ext = kid(el, "a:ext");
  if (!off || !ext) return null;
  return { x: num(off, "x") ?? 0, y: num(off, "y") ?? 0, w: num(ext, "cx") ?? 0, h: num(ext, "cy") ?? 0 };
}

// ---------------------------------------------------------------- colours

type Theme = Map<string, string>;

function readTheme(doc: Document | null): Theme {
  const theme: Theme = new Map();
  const scheme = doc?.getElementsByTagName("a:clrScheme")[0];
  for (const c of kids(scheme)) {
    const name = c.nodeName.replace(/^a:/, "");
    const srgb = kid(c, "a:srgbClr")?.getAttribute("val");
    const sys = kid(c, "a:sysClr")?.getAttribute("lastClr");
    if (srgb || sys) theme.set(name, `#${srgb ?? sys}`);
  }
  // Slide-level aliases.
  const alias: Record<string, string> = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
  for (const [a, b] of Object.entries(alias)) if (theme.has(b)) theme.set(a, theme.get(b)!);
  return theme;
}

function hexToHsl(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex([h, s, l]: number[]) {
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r = l;
  let g = l;
  let b = l;
  if (s) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    [r, g, b] = [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)];
  }
  return `#${[r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** A colour element (a:srgbClr, a:schemeClr, …) with its brightness modifiers applied. */
function colorOf(el: Element | null, theme: Theme): string | null {
  if (!el) return null;
  const c = kids(el).find((k) => ["a:srgbClr", "a:schemeClr", "a:sysClr", "a:prstClr"].includes(k.nodeName));
  if (!c) return null;
  let hex: string | undefined;
  if (c.nodeName === "a:srgbClr") hex = `#${c.getAttribute("val")}`;
  else if (c.nodeName === "a:sysClr") hex = `#${c.getAttribute("lastClr") ?? "000000"}`;
  else if (c.nodeName === "a:schemeClr") hex = theme.get(c.getAttribute("val") ?? "");
  else hex = ({ black: "#000000", white: "#ffffff", red: "#ff0000", blue: "#0000ff", green: "#008000", yellow: "#ffff00" } as Record<string, string>)[c.getAttribute("val") ?? ""];
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const mod = (name: string) => num(kid(c, name), "val");
  const [lumMod, lumOff, tint, shade] = [mod("a:lumMod"), mod("a:lumOff"), mod("a:tint"), mod("a:shade")];
  if (lumMod !== undefined || lumOff !== undefined || tint !== undefined || shade !== undefined) {
    const hsl = hexToHsl(hex);
    if (lumMod !== undefined) hsl[2] *= lumMod / 100000;
    if (lumOff !== undefined) hsl[2] += lumOff / 100000;
    if (tint !== undefined) hsl[2] = hsl[2] * (tint / 100000) + (1 - tint / 100000);
    if (shade !== undefined) hsl[2] *= shade / 100000;
    hsl[2] = Math.min(1, Math.max(0, hsl[2]));
    hex = hslToHex(hsl);
  }
  const alpha = mod("a:alpha");
  if (alpha !== undefined && alpha < 100000) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha / 100000})`;
  }
  return hex;
}

// ---------------------------------------------------------------- slides

export interface SlideDeck {
  widthPx: number;
  heightPx: number;
  /** One element per slide, stacked; pass to pagesToPdf(). */
  root: HTMLElement;
  count: number;
  /** Object URLs created for pictures — revoke when done. */
  urls: string[];
}

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", webp: "image/webp", svg: "image/svg+xml" };

interface Context {
  files: Files;
  theme: Theme;
  urls: string[];
  /** Placeholder positions from the layout and master, by "type:x" and "idx:n". */
  placeholders: Map<string, Xfrm>;
}

function placeholderKey(sp: Element) {
  const ph = sp.getElementsByTagName("p:ph")[0];
  if (!ph) return null;
  return { type: ph.getAttribute("type") ?? "body", idx: ph.getAttribute("idx") };
}

function collectPlaceholders(part: Part | null, into: Map<string, Xfrm>) {
  if (!part) return;
  for (const sp of part.doc.getElementsByTagName("p:sp")) {
    const key = placeholderKey(sp);
    const xfrm = readXfrm(path(sp, "p:spPr", "a:xfrm"));
    if (!key || !xfrm) continue;
    if (!into.has(`type:${key.type}`)) into.set(`type:${key.type}`, xfrm);
    if (key.idx && !into.has(`idx:${key.idx}`)) into.set(`idx:${key.idx}`, xfrm);
  }
}

function imageUrl(ctx: Context, part: Part, embed: string | null) {
  const target = embed ? part.rels.get(embed) : undefined;
  const bytes = target ? ctx.files[target] : undefined;
  const type = MIME[target?.split(".").pop()?.toLowerCase() ?? ""];
  if (!bytes || !type) return null; // EMF/WMF/TIFF can't be shown by browsers
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type }));
  ctx.urls.push(url);
  return url;
}

const px = (emu: number) => emu / EMU_PER_PX;

function box(el: HTMLElement, x: Xfrm, rot?: number) {
  Object.assign(el.style, { position: "absolute", left: `${px(x.x)}px`, top: `${px(x.y)}px`, width: `${px(x.w)}px`, height: `${px(x.h)}px` });
  if (rot) el.style.transform = `rotate(${rot / 60000}deg)`;
}

const DEFAULT_SIZE: Record<string, number> = { title: 40, ctrTitle: 44, subTitle: 24, body: 22, obj: 22 };

function textBody(ctx: Context, txBody: Element, placeholder: string | null, defaultColor: string): HTMLElement {
  const wrap = document.createElement("div");
  const bodyPr = kid(txBody, "a:bodyPr");
  const inset = (attr: string, def: number) => px(num(bodyPr, attr) ?? def);
  const anchor = bodyPr?.getAttribute("anchor") ?? (placeholder === "title" || placeholder === "ctrTitle" ? "ctr" : "t");
  const scale = (num(kid(bodyPr, "a:normAutofit"), "fontScale") ?? 100000) / 100000;
  Object.assign(wrap.style, {
    position: "absolute",
    inset: "0",
    padding: `${inset("tIns", 45720)}px ${inset("rIns", 91440)}px ${inset("bIns", 45720)}px ${inset("lIns", 91440)}px`,
    display: "flex",
    flexDirection: "column",
    justifyContent: anchor === "ctr" ? "center" : anchor === "b" ? "flex-end" : "flex-start",
    overflow: "hidden",
    overflowWrap: "anywhere",
    whiteSpace: bodyPr?.getAttribute("wrap") === "none" ? "pre" : "pre-wrap",
  });
  const baseSize = DEFAULT_SIZE[placeholder ?? ""] ?? 18;
  const bulleted = placeholder === "body" || placeholder === "obj";
  const numbering = new Map<number, number>();

  for (const p of kids(txBody, "a:p")) {
    const pPr = kid(p, "a:pPr");
    const lvl = num(pPr, "lvl") ?? 0;
    const para = document.createElement("p");
    const algn = pPr?.getAttribute("algn");
    Object.assign(para.style, {
      margin: "0",
      textAlign: algn === "ctr" ? "center" : algn === "r" ? "right" : algn === "just" ? "justify" : "left",
      lineHeight: "1.15",
      paddingLeft: `${lvl * 24}px`,
    });
    const runs = kids(p).filter((k) => ["a:r", "a:fld", "a:br"].includes(k.nodeName));
    const defaultSize = baseSize - lvl * 2;
    const endSize = num(kid(p, "a:endParaRPr"), "sz");
    let firstSize: number | undefined;

    const hasText = runs.some((r) => r.nodeName !== "a:br" && (kid(r, "a:t")?.textContent ?? "") !== "");
    const buChar = kid(pPr, "a:buChar")?.getAttribute("char");
    const autoNum = kid(pPr, "a:buAutoNum");
    const noBullet = kid(pPr, "a:buNone");
    let bullet = "";
    if (hasText && !noBullet) {
      if (autoNum) {
        const n = (numbering.get(lvl) ?? num(autoNum, "startAt") ?? 1) as number;
        numbering.set(lvl, n + 1);
        bullet = /alpha/i.test(autoNum.getAttribute("type") ?? "") ? `${String.fromCharCode(96 + n)}.` : `${n}.`;
      } else if (buChar) bullet = buChar;
      else if (bulleted) bullet = "•";
    }

    for (const r of runs) {
      if (r.nodeName === "a:br") {
        para.appendChild(document.createElement("br"));
        continue;
      }
      const rPr = kid(r, "a:rPr");
      const span = document.createElement("span");
      span.textContent = kid(r, "a:t")?.textContent ?? "";
      const size = num(rPr, "sz");
      const pt = size ? size / 100 : defaultSize;
      firstSize ??= pt;
      const color = colorOf(kid(rPr, "a:solidFill"), ctx.theme);
      Object.assign(span.style, {
        fontSize: `${(pt * scale).toFixed(2)}pt`,
        fontWeight: rPr?.getAttribute("b") === "1" ? "700" : "",
        fontStyle: rPr?.getAttribute("i") === "1" ? "italic" : "",
        textDecoration: rPr?.getAttribute("u") && rPr.getAttribute("u") !== "none" ? "underline" : "",
        color: color ?? defaultColor,
      });
      const font = kid(rPr, "a:latin")?.getAttribute("typeface");
      if (font && !font.startsWith("+")) span.style.fontFamily = `"${font}", Arial, sans-serif`;
      para.appendChild(span);
    }
    const leadSize = firstSize ?? (endSize ? endSize / 100 : defaultSize);
    if (bullet) {
      const b = document.createElement("span");
      b.textContent = `${bullet} `;
      b.style.fontSize = `${(leadSize * scale).toFixed(2)}pt`;
      para.prepend(b);
    }
    // Keep empty paragraphs as blank lines of the right height.
    if (!para.textContent) {
      para.style.fontSize = `${(leadSize * scale).toFixed(2)}pt`;
      para.innerHTML = "&nbsp;";
    }
    const spcBef = num(path(pPr, "a:spcBef", "a:spcPts"), "val");
    if (spcBef) para.style.marginTop = `${spcBef / 100}pt`;
    wrap.appendChild(para);
  }
  return wrap;
}

function applyFill(ctx: Context, el: HTMLElement, spPr: Element | null) {
  const fill = colorOf(kid(spPr, "a:solidFill"), ctx.theme);
  if (fill) el.style.background = fill;
  const ln = kid(spPr, "a:ln");
  if (ln && !kid(ln, "a:noFill")) {
    const color = colorOf(kid(ln, "a:solidFill"), ctx.theme);
    if (color) el.style.border = `${Math.max(1, px(num(ln, "w") ?? 9525))}px solid ${color}`;
  }
  const geom = kid(spPr, "a:prstGeom")?.getAttribute("prst");
  if (geom === "ellipse") el.style.borderRadius = "50%";
  else if (geom === "roundRect") el.style.borderRadius = "12px";
}

/** Map a group's child coordinate space onto the slide. */
function groupTransform(grpSpPr: Element | null) {
  const x = path(grpSpPr, "a:xfrm");
  const off = kid(x, "a:off");
  const ext = kid(x, "a:ext");
  const chOff = kid(x, "a:chOff");
  const chExt = kid(x, "a:chExt");
  if (!off || !ext || !chOff || !chExt) return (v: Xfrm) => v;
  const sx = (num(ext, "cx") ?? 1) / (num(chExt, "cx") || 1);
  const sy = (num(ext, "cy") ?? 1) / (num(chExt, "cy") || 1);
  return (v: Xfrm) => ({
    x: (num(off, "x") ?? 0) + (v.x - (num(chOff, "x") ?? 0)) * sx,
    y: (num(off, "y") ?? 0) + (v.y - (num(chOff, "y") ?? 0)) * sy,
    w: v.w * sx,
    h: v.h * sy,
  });
}

/** Draw a shape tree. `decorationsOnly` skips placeholders — on layouts and masters they're prompts ("Click to add title"). */
function renderTree(ctx: Context, part: Part, tree: Element, into: HTMLElement, map: (v: Xfrm) => Xfrm, defaultColor: string, decorationsOnly = false) {
  for (const node of kids(tree)) {
    if (decorationsOnly && node.getElementsByTagName("p:ph").length) continue;
    if (node.nodeName === "p:sp") {
      const spPr = kid(node, "p:spPr");
      const key = placeholderKey(node);
      const own = readXfrm(path(spPr, "a:xfrm"));
      const inherited = key ? ((key.idx && ctx.placeholders.get(`idx:${key.idx}`)) || ctx.placeholders.get(`type:${key.type}`)) : undefined;
      const xfrm = own ?? inherited;
      if (!xfrm) continue;
      const el = document.createElement("div");
      box(el, map(xfrm), num(kid(spPr, "a:xfrm"), "rot"));
      applyFill(ctx, el, spPr);
      const tx = kid(node, "p:txBody");
      if (tx) el.appendChild(textBody(ctx, tx, key?.type ?? null, defaultColor));
      if (el.style.background || el.style.border || el.textContent?.trim()) into.appendChild(el);
    } else if (node.nodeName === "p:pic") {
      const xfrm = readXfrm(path(node, "p:spPr", "a:xfrm"));
      const url = imageUrl(ctx, part, path(node, "p:blipFill", "a:blip")?.getAttribute("r:embed") ?? null);
      if (!xfrm || !url) continue;
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      box(img, map(xfrm), num(path(node, "p:spPr", "a:xfrm"), "rot"));
      img.style.objectFit = "fill";
      into.appendChild(img);
    } else if (node.nodeName === "p:graphicFrame") {
      const xfrm = readXfrm(kid(node, "p:xfrm"));
      const tbl = node.getElementsByTagName("a:tbl")[0];
      if (!xfrm || !tbl) continue;
      const holder = document.createElement("div");
      box(holder, map(xfrm));
      const table = document.createElement("table");
      Object.assign(table.style, { width: "100%", borderCollapse: "collapse", fontSize: "12pt" });
      for (const tr of kids(tbl, "a:tr")) {
        const row = table.insertRow();
        for (const tc of kids(tr, "a:tc")) {
          if (tc.getAttribute("hMerge") === "1" || tc.getAttribute("vMerge") === "1") continue;
          const cell = row.insertCell();
          const span = num(tc, "gridSpan");
          const rowSpan = num(tc, "rowSpan");
          if (span) cell.colSpan = span;
          if (rowSpan) cell.rowSpan = rowSpan;
          Object.assign(cell.style, { border: "1px solid #999", padding: "4px 6px", verticalAlign: "top", position: "relative" });
          const fill = colorOf(kid(kid(tc, "a:tcPr"), "a:solidFill"), ctx.theme);
          if (fill) cell.style.background = fill;
          const body = kid(tc, "a:txBody");
          if (body) {
            const text = textBody(ctx, body, null, defaultColor);
            Object.assign(text.style, { position: "static", padding: "0" });
            cell.appendChild(text);
          }
        }
      }
      holder.appendChild(table);
      into.appendChild(holder);
    } else if (node.nodeName === "p:grpSp") {
      const inner = groupTransform(kid(node, "p:grpSpPr"));
      renderTree(ctx, part, node, into, (v) => map(inner(v)), defaultColor, decorationsOnly);
    }
  }
}

/** Background from the slide, else its layout, else the master: a colour or a picture. */
function background(ctx: Context, parts: (Part | null)[]): { color?: string; image?: string } {
  for (const part of parts) {
    const bg = part?.doc.getElementsByTagName("p:bg")[0];
    if (!part || !bg) continue;
    const bgPr = kid(bg, "p:bgPr");
    const color = colorOf(kid(bgPr, "a:solidFill"), ctx.theme);
    if (color) return { color };
    const blip = path(bgPr, "a:blipFill", "a:blip");
    const image = blip ? imageUrl(ctx, part, blip.getAttribute("r:embed")) : null;
    if (image) return { image };
    const gradient = bgPr?.getElementsByTagName("a:gs");
    if (gradient?.length) {
      const stops = [...gradient].map((gs) => colorOf(gs, ctx.theme)).filter(Boolean);
      if (stops.length) return { color: stops[0]! };
    }
    const ref = kid(bg, "p:bgRef");
    const refColor = colorOf(ref, ctx.theme);
    if (refColor) return { color: refColor };
  }
  return {};
}

export async function readPptx(bytes: Uint8Array): Promise<SlideDeck> {
  let files: Files;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error("This file couldn't be opened. Save it as .pptx in PowerPoint and try again.");
  }
  const presentation = loadPart(files, "ppt/presentation.xml");
  if (!presentation) throw new Error("This isn't a PowerPoint (.pptx) file.");
  const size = presentation.doc.getElementsByTagName("p:sldSz")[0];
  const widthPx = Math.round(px(num(size, "cx") ?? 12192000));
  const heightPx = Math.round(px(num(size, "cy") ?? 6858000));

  const slideIds = [...presentation.doc.getElementsByTagName("p:sldId")].map((s) => s.getAttribute("r:id") ?? "");
  const slidePaths = slideIds.map((id) => presentation.rels.get(id)).filter((p): p is string => !!p && !!files[p]);
  if (slidePaths.length === 0) throw new Error("This presentation has no slides.");

  const urls: string[] = [];
  const root = document.createElement("div");
  for (const slidePath of slidePaths) {
    const slide = loadPart(files, slidePath);
    if (!slide) continue;
    // Hidden slides aren't printed by PowerPoint either.
    if (slide.doc.documentElement.getAttribute("show") === "0") continue;
    const layoutPath = [...slide.rels.values()].find((p) => p.includes("slideLayouts/"));
    const layout = layoutPath ? loadPart(files, layoutPath) : null;
    const masterPath = layout ? [...layout.rels.values()].find((p) => p.includes("slideMasters/")) : undefined;
    const master = masterPath ? loadPart(files, masterPath) : null;
    const themePath = master ? [...master.rels.values()].find((p) => p.includes("theme/")) : undefined;
    const placeholders = new Map<string, Xfrm>();
    collectPlaceholders(layout, placeholders);
    collectPlaceholders(master, placeholders);
    const ctx: Context = { files, theme: readTheme(themePath ? parse(files, themePath) : null), urls, placeholders };
    const defaultColor = ctx.theme.get("tx1") ?? "#000000";

    const page = document.createElement("div");
    Object.assign(page.style, { position: "relative", width: `${widthPx}px`, height: `${heightPx}px`, overflow: "hidden", background: "#ffffff", fontFamily: "Calibri, Carlito, Arial, 'Noto Sans', 'Nirmala UI', sans-serif" });
    const bg = background(ctx, [slide, layout, master]);
    if (bg.color) page.style.background = bg.color;
    if (bg.image) Object.assign(page.style, { backgroundImage: `url("${bg.image}")`, backgroundSize: "cover" });

    // Pictures and shapes drawn on the layout (logos, bars) appear on the slide too, under its content.
    for (const part of [master, layout]) {
      if (!part || slide.doc.documentElement.getAttribute("showMasterSp") === "0") continue;
      const tree = part.doc.getElementsByTagName("p:spTree")[0];
      if (tree) renderTree(ctx, part, tree, page, (v) => v, defaultColor, true);
    }

    const tree = slide.doc.getElementsByTagName("p:spTree")[0];
    if (tree) renderTree(ctx, slide, tree, page, (v) => v, defaultColor);
    root.appendChild(page);
  }
  return { widthPx, heightPx, root, count: root.children.length, urls };
}
