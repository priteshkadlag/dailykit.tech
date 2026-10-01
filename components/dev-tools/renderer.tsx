"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** Placeholder while a tool's code loads. */
function Loading() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted/60" aria-label="Loading tool" />;
}

// Each tool loads only its own code (and libraries such as Prettier) when its page opens.
const load = <P extends object>(loader: () => Promise<ComponentType<P>>) => dynamic(loader, { ssr: false, loading: Loading });
const formatters = () => import("@/components/dev-tools/formatters");
const encoders = () => import("@/components/dev-tools/encoders");
const generators = () => import("@/components/dev-tools/generators");
const converters = () => import("@/components/dev-tools/converters");
const css = () => import("@/components/dev-tools/css-tools");
const testing = () => import("@/components/dev-tools/testing");
const web = () => import("@/components/dev-tools/web-tools");

const CodeFormatter = load(() => formatters().then((m) => m.CodeFormatter));
const DataConverter = load(() => converters().then((m) => m.DataConverter));
const ColorConverter = load(() => css().then((m) => m.ColorConverter));

const TOOLS: Record<string, ComponentType> = {
  "json-formatter": () => <CodeFormatter kind="json-format" />,
  "json-minifier": () => <CodeFormatter kind="json-minify" />,
  "html-formatter": () => <CodeFormatter kind="html-format" />,
  "html-minifier": () => <CodeFormatter kind="html-minify" />,
  "css-formatter": () => <CodeFormatter kind="css-format" />,
  "css-minifier": () => <CodeFormatter kind="css-minify" />,
  "javascript-formatter": () => <CodeFormatter kind="js-format" />,
  "javascript-minifier": () => <CodeFormatter kind="js-minify" />,
  "xml-formatter": () => <CodeFormatter kind="xml-format" />,
  "sql-formatter": () => <CodeFormatter kind="sql-format" />,

  "url-encoder-decoder": load(() => encoders().then((m) => m.UrlCodec)),
  "base64-encoder-decoder": load(() => encoders().then((m) => m.Base64Codec)),
  "html-entity-encoder-decoder": load(() => encoders().then((m) => m.EntityCodec)),
  "jwt-decoder": load(() => encoders().then((m) => m.JwtDecoder)),
  "image-to-base64": load(() => encoders().then((m) => m.ImageToBase64)),
  "base64-to-image": load(() => encoders().then((m) => m.Base64ToImage)),
  "url-parser": load(() => encoders().then((m) => m.UrlParser)),

  "uuid-generator": load(() => generators().then((m) => m.UuidGenerator)),
  "random-string-generator": load(() => generators().then((m) => m.RandomStringGenerator)),
  "hash-generator": load(() => generators().then((m) => m.HashGenerator)),
  "unix-timestamp-generator": load(() => generators().then((m) => m.UnixTimestampGenerator)),
  "cron-expression-generator": load(() => generators().then((m) => m.CronGenerator)),
  "regex-generator": load(() => generators().then((m) => m.RegexGenerator)),
  "curl-generator": load(() => generators().then((m) => m.CurlGenerator)),

  "timestamp-converter": load(() => converters().then((m) => m.TimestampConverter)),
  "number-base-converter": load(() => converters().then((m) => m.NumberBaseConverter)),
  "file-size-converter": load(() => converters().then((m) => m.FileSizeConverter)),
  "csv-to-json": () => <DataConverter from="csv" to="json" />,
  "json-to-csv": () => <DataConverter from="json" to="csv" />,
  "json-to-yaml": () => <DataConverter from="json" to="yaml" />,
  "yaml-to-json": () => <DataConverter from="yaml" to="json" />,
  "xml-to-json": () => <DataConverter from="xml" to="json" />,
  "markdown-to-html": load(() => testing().then((m) => m.MarkdownToHtml)),

  "hex-to-rgb": () => <ColorConverter from="hex" />,
  "rgb-to-hex": () => <ColorConverter from="rgb" />,
  "hsl-to-hex": () => <ColorConverter from="hsl" />,
  "color-contrast-checker": load(() => css().then((m) => m.ContrastChecker)),
  "css-gradient-generator": load(() => css().then((m) => m.GradientGenerator)),
  "box-shadow-generator": load(() => css().then((m) => m.BoxShadowGenerator)),
  "border-radius-generator": load(() => css().then((m) => m.BorderRadiusGenerator)),

  "regex-tester": load(() => testing().then((m) => m.RegexTester)),
  "diff-checker": load(() => testing().then((m) => m.DiffChecker)),
  "markdown-editor": load(() => testing().then((m) => m.MarkdownEditor)),
  "email-validator": load(() => testing().then((m) => m.EmailValidator)),
  "phone-number-formatter": load(() => testing().then((m) => m.PhoneFormatter)),
  "api-request-builder": load(() => testing().then((m) => m.ApiRequestBuilder)),

  "ip-address-checker": load(() => web().then((m) => m.IpChecker)),
  "user-agent-parser": load(() => web().then((m) => m.UserAgentParser)),
  "http-status-codes": load(() => web().then((m) => m.HttpStatusLookup)),
  "mime-type-lookup": load(() => web().then((m) => m.MimeLookup)),
  "dns-lookup": load(() => web().then((m) => m.DnsLookup)),
  "qr-code-scanner": load(() => web().then((m) => m.QrScanner)),
};

export const renderableDevTools = Object.keys(TOOLS);

export function DevToolRenderer({ slug }: { slug: string }) {
  const Tool = TOOLS[slug];
  return Tool ? <Tool /> : null;
}
