"use client";

import { useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { byteSize, formatBytes, formatJson, formatXml, minifyCss, minifyHtml, minifyJson, minifyXml, type Result } from "@/lib/dev-tools/code";
import { CheckboxField, SelectField } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { CodeArea, CopyText, DownloadText, ErrorNote, Hint, OkNote, OpenFileButton, Panel, TwoPane } from "@/components/dev-tools/shared";

export type FormatterKind =
  | "json-format" | "json-minify" | "html-format" | "html-minify" | "css-format" | "css-minify" | "js-format" | "js-minify" | "xml-format" | "sql-format";

interface Options {
  indent: string;
  sortKeys: boolean;
  cssLang: "css" | "scss" | "less";
  jsLang: "babel" | "typescript";
  semi: boolean;
  singleQuote: boolean;
  printWidth: string;
  mangle: boolean;
  dropConsole: boolean;
  keepComments: boolean;
  xmlMinify: boolean;
  sqlLang: string;
  keywordCase: "preserve" | "upper" | "lower";
}

const DEFAULTS: Options = {
  indent: "2", sortKeys: false, cssLang: "css", jsLang: "babel", semi: true, singleQuote: false, printWidth: "80", mangle: true, dropConsole: false,
  keepComments: false, xmlMinify: false, sqlLang: "sql", keywordCase: "upper",
};

const CONFIG: Record<FormatterKind, { input: string; output: string; ext: string; mime: string; sample: string; minify?: boolean }> = {
  "json-format": { input: "JSON", output: "Formatted JSON", ext: "json", mime: "application/json", sample: '{"name":"DailyKit","tools":["json","csv"],"active":true,"stats":{"users":1200,"rating":4.8}}' },
  "json-minify": { input: "JSON", output: "Minified JSON", ext: "json", mime: "application/json", minify: true, sample: '{\n  "name": "DailyKit",\n  "tools": ["json", "csv"],\n  "active": true\n}' },
  "html-format": { input: "HTML", output: "Formatted HTML", ext: "html", mime: "text/html", sample: '<!doctype html><html><head><title>Demo</title><style>body{margin:0;font-family:sans-serif}</style></head><body><div class="card"><h1>Hello</h1><p>Some <b>bold</b> text.</p><ul><li>One</li><li>Two</li></ul></div><script>const a=1;console.log(a)</script></body></html>' },
  "html-minify": { input: "HTML", output: "Minified HTML", ext: "html", mime: "text/html", minify: true, sample: '<!DOCTYPE html>\n<html>\n  <head>\n    <!-- page title -->\n    <title>Demo</title>\n  </head>\n  <body>\n    <p>\n      Hello   world\n    </p>\n  </body>\n</html>' },
  "css-format": { input: "CSS", output: "Formatted CSS", ext: "css", mime: "text/css", sample: ".card{display:flex;gap:1rem;padding:16px 24px}.card:hover{box-shadow:0 2px 8px rgba(0,0,0,.2)}@media (max-width:600px){.card{flex-direction:column}}" },
  "css-minify": { input: "CSS", output: "Minified CSS", ext: "css", mime: "text/css", minify: true, sample: "/* Card */\n.card {\n  display: flex;\n  width: calc(100% - 2rem);\n  padding: 16px 24px;\n}\n\n.card:hover {\n  color: #1e40af;\n}\n" },
  "js-format": { input: "JavaScript", output: "Formatted JavaScript", ext: "js", mime: "text/javascript", sample: "function greet(name){if(!name){return 'Hello, stranger'}const msg=`Hello, ${name}!`;return msg}const users=[{id:1,name:'Asha'},{id:2,name:'Ravi'}];users.forEach(u=>console.log(greet(u.name)))" },
  "js-minify": { input: "JavaScript", output: "Minified JavaScript", ext: "min.js", mime: "text/javascript", minify: true, sample: "// Adds two numbers\nfunction add(first, second) {\n  const total = first + second;\n  console.log('total', total);\n  return total;\n}\n\nexport const result = add(2, 3);\n" },
  "xml-format": { input: "XML", output: "Formatted XML", ext: "xml", mime: "application/xml", sample: '<?xml version="1.0" encoding="UTF-8"?><catalog><book id="1"><title>XML Basics</title><price currency="INR">499</price></book><book id="2"><title>Advanced XML</title><price currency="INR">799</price></book></catalog>' },
  "sql-format": { input: "SQL", output: "Formatted SQL", ext: "sql", mime: "application/sql", sample: "select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = 1 and o.created_at > '2024-01-01' group by u.id, u.name having count(o.id) > 2 order by orders desc limit 10;" },
};

const SQL_LANGUAGES = [
  { value: "sql", label: "Standard SQL" }, { value: "mysql", label: "MySQL" }, { value: "mariadb", label: "MariaDB" }, { value: "postgresql", label: "PostgreSQL" },
  { value: "tsql", label: "SQL Server (T-SQL)" }, { value: "sqlite", label: "SQLite" }, { value: "plsql", label: "Oracle PL/SQL" }, { value: "bigquery", label: "BigQuery" },
  { value: "snowflake", label: "Snowflake" }, { value: "redshift", label: "Amazon Redshift" },
] as const;

const indentOf = (indent: string) => (indent === "tab" ? "\t" : " ".repeat(Number(indent)));

async function prettierFormat(code: string, parser: string, options: Options): Promise<string> {
  const [prettier, html, postcss, babel, estree] = await Promise.all([
    import("prettier/standalone"), import("prettier/plugins/html"), import("prettier/plugins/postcss"), import("prettier/plugins/babel"), import("prettier/plugins/estree"),
  ]);
  const plugins: import("prettier").Plugin[] = [html, postcss, babel, estree];
  if (parser === "typescript") plugins.push(await import("prettier/plugins/typescript"));
  return prettier.format(code, {
    parser, plugins,
    useTabs: options.indent === "tab",
    tabWidth: options.indent === "tab" ? 2 : Number(options.indent),
    printWidth: Number(options.printWidth),
    semi: options.semi,
    singleQuote: options.singleQuote,
  });
}

async function run(kind: FormatterKind, code: string, options: Options): Promise<Result> {
  try {
    switch (kind) {
      case "json-format": return formatJson(code, options.indent === "tab" ? "\t" : Number(options.indent), options.sortKeys);
      case "json-minify": return minifyJson(code);
      case "xml-format": return options.xmlMinify ? minifyXml(code) : formatXml(code, indentOf(options.indent));
      case "css-minify": return { ok: true, value: minifyCss(code) };
      case "html-minify": return { ok: true, value: minifyHtml(code, { removeComments: !options.keepComments }) };
      case "html-format": return { ok: true, value: await prettierFormat(code, "html", options) };
      case "css-format": return { ok: true, value: await prettierFormat(code, options.cssLang, options) };
      case "js-format": return { ok: true, value: await prettierFormat(code, options.jsLang, options) };
      case "js-minify": {
        const { minify } = await import("terser");
        const result = await minify(code, {
          mangle: options.mangle,
          compress: { drop_console: options.dropConsole },
          format: { comments: options.keepComments ? "some" : false },
          module: /\b(?:import|export)\b/.test(code),
        });
        return { ok: true, value: result.code ?? "" };
      }
      case "sql-format": {
        const { format } = await import("sql-formatter");
        return { ok: true, value: format(code, { language: options.sqlLang as "sql", keywordCase: options.keywordCase, tabWidth: options.indent === "tab" ? 2 : Number(options.indent), useTabs: options.indent === "tab" }) };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Prettier and Terser include a code frame after the first line; the first line says what and where.
    return { ok: false, error: message.split("\n")[0].replace(/\s*\(\d+:\d+\)$/, (m) => ` — line ${m.trim().slice(1, -1).replace(":", ", column ")}`) };
  }
}

export function CodeFormatter({ kind }: { kind: FormatterKind }) {
  const config = CONFIG[kind];
  const [code, setCode] = useState("");
  const [options, setOptions] = useState(DEFAULTS);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Options>(key: K) => (value: Options[K]) => setOptions((o) => ({ ...o, [key]: value }));
  const instant = kind === "json-format" || kind === "json-minify" || kind === "xml-format" || kind === "css-minify" || kind === "html-minify";

  const convert = async () => {
    if (!code.trim()) { setResult(null); return; }
    setBusy(true);
    setResult(await run(kind, code, options));
    setBusy(false);
  };

  // Fast, local formatters update as you type; library-backed ones run on the button.
  useEffect(() => {
    if (!instant) return;
    let cancelled = false;
    const timer = setTimeout(() => { if (!code.trim()) { setResult(null); return; } run(kind, code, options).then((r) => { if (!cancelled) setResult(r); }); }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [code, options, kind, instant]);

  const output = result?.ok ? result.value : "";
  const before = byteSize(code);
  const after = byteSize(output);

  return (
    <div className="space-y-4">
      <Panel title="Options">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!config.minify && <SelectField label="Indentation" value={options.indent} onChange={set("indent")} options={[{ value: "2", label: "2 spaces" }, { value: "4", label: "4 spaces" }, { value: "tab", label: "Tabs" }]} />}
          {kind === "json-format" && <CheckboxField label="Sort keys A–Z" checked={options.sortKeys} onChange={set("sortKeys")} className="self-end pb-2" />}
          {kind === "xml-format" && <CheckboxField label="Minify instead" checked={options.xmlMinify} onChange={set("xmlMinify")} className="self-end pb-2" />}
          {kind === "css-format" && <SelectField label="Language" value={options.cssLang} onChange={set("cssLang")} options={[{ value: "css", label: "CSS" }, { value: "scss", label: "SCSS" }, { value: "less", label: "Less" }]} />}
          {kind === "js-format" && <>
            <SelectField label="Language" value={options.jsLang} onChange={set("jsLang")} options={[{ value: "babel", label: "JavaScript / JSX" }, { value: "typescript", label: "TypeScript" }]} />
            <CheckboxField label="Semicolons" checked={options.semi} onChange={set("semi")} className="self-end pb-2" />
            <CheckboxField label="Single quotes" checked={options.singleQuote} onChange={set("singleQuote")} className="self-end pb-2" />
          </>}
          {(kind === "html-format" || kind === "css-format" || kind === "js-format") && <SelectField label="Line width" value={options.printWidth} onChange={set("printWidth")} options={[{ value: "80", label: "80 characters" }, { value: "100", label: "100 characters" }, { value: "120", label: "120 characters" }]} />}
          {kind === "js-minify" && <>
            <CheckboxField label="Shorten variable names (mangle)" checked={options.mangle} onChange={set("mangle")} />
            <CheckboxField label="Remove console.* calls" checked={options.dropConsole} onChange={set("dropConsole")} />
            <CheckboxField label="Keep licence comments" checked={options.keepComments} onChange={set("keepComments")} />
          </>}
          {kind === "html-minify" && <CheckboxField label="Keep comments" checked={options.keepComments} onChange={set("keepComments")} />}
          {kind === "sql-format" && <>
            <SelectField label="Dialect" value={options.sqlLang} onChange={set("sqlLang")} options={SQL_LANGUAGES} />
            <SelectField label="Keywords" value={options.keywordCase} onChange={set("keywordCase")} options={[{ value: "upper", label: "UPPERCASE" }, { value: "lower", label: "lowercase" }, { value: "preserve", label: "As typed" }]} />
          </>}
          {config.minify && kind === "json-minify" && <Hint>The JSON is validated first, so the output is always valid.</Hint>}
          {kind === "css-minify" && <Hint>Strings, url() values and calc() spacing are kept. Comments starting /*! are kept as licence notices.</Hint>}
        </div>
      </Panel>
      <TwoPane
        left={<Panel title={config.input} actions={<><OpenFileButton accept={`.${config.ext.replace("min.", "")},.txt`} onText={(text) => setCode(text)} /><Button variant="ghost" size="lg" onClick={() => setCode(config.sample)}>Sample</Button><Button variant="ghost" size="lg" onClick={() => { setCode(""); setResult(null); }}>Clear</Button></>}>
          <CodeArea label={`${config.input} input`} hideLabel value={code} onChange={setCode} rows={18} placeholder={`Paste ${config.input} here…`} invalid={result?.ok === false} />
          {!instant && <Button className="h-10 w-full" onClick={convert} disabled={busy || !code.trim()}>{busy ? <Loader2 className="animate-spin" /> : <Wand2 />} {config.minify ? "Minify" : "Format"} {config.input}</Button>}
        </Panel>}
        right={<Panel title={config.output} actions={<><CopyText text={output} /><DownloadText text={output} fileName={`output.${config.ext}`} type={config.mime} /></>}>
          <CodeArea label={config.output} hideLabel value={output} readOnly rows={18} placeholder={instant ? "The result appears as you type." : `Press ${config.minify ? "Minify" : "Format"} to see the result.`} />
          {result?.ok === false && <ErrorNote>{result.error}</ErrorNote>}
          {result?.ok && (config.minify || kind === "xml-format" || kind === "json-format")
            ? <OkNote>{kind === "json-format" ? "Valid JSON." : kind === "xml-format" ? "Well-formed XML." : ""} {config.minify || options.xmlMinify ? `${formatBytes(before)} → ${formatBytes(after)} (${before ? Math.round((1 - after / before) * 100) : 0}% smaller).` : ""}</OkNote>
            : null}
        </Panel>}
      />
    </div>
  );
}
