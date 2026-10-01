/** Text diffing, user agents, IP addresses, email checks and web reference data. */

// ---- Diff

export type DiffOp = { type: "same" | "add" | "remove"; text: string };

/** Longest-common-subsequence diff of two token lists (Myers-style output, O(n·m) memory-bounded). */
export function diffTokens(a: string[], b: string[], equal: (x: string, y: string) => boolean = (x, y) => x === y): DiffOp[] {
  // Trim the common prefix and suffix first; most real diffs are small changes in large texts.
  let start = 0;
  while (start < a.length && start < b.length && equal(a[start], b[start])) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && equal(a[endA - 1], b[endB - 1])) { endA--; endB--; }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  const ops: DiffOp[] = a.slice(0, start).map((text) => ({ type: "same", text }));
  if (midA.length * midB.length > 25_000_000) {
    // Too large for a full table: report the middle as replaced.
    ops.push(...midA.map((text) => ({ type: "remove" as const, text })), ...midB.map((text) => ({ type: "add" as const, text })));
  } else {
    const rows = midA.length + 1;
    const cols = midB.length + 1;
    const table = new Uint32Array(rows * cols);
    for (let i = midA.length - 1; i >= 0; i--) {
      for (let j = midB.length - 1; j >= 0; j--) {
        table[i * cols + j] = equal(midA[i], midB[j]) ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < midA.length && j < midB.length) {
      if (equal(midA[i], midB[j])) { ops.push({ type: "same", text: midA[i] }); i++; j++; }
      else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) ops.push({ type: "remove", text: midA[i++] });
      else ops.push({ type: "add", text: midB[j++] });
    }
    while (i < midA.length) ops.push({ type: "remove", text: midA[i++] });
    while (j < midB.length) ops.push({ type: "add", text: midB[j++] });
  }
  ops.push(...a.slice(endA).map((text) => ({ type: "same" as const, text })));
  return ops;
}

export function diffLines(left: string, right: string, { ignoreWhitespace = false, ignoreCase = false } = {}) {
  const norm = (line: string) => {
    let out = ignoreWhitespace ? line.replace(/\s+/g, " ").trim() : line;
    if (ignoreCase) out = out.toLowerCase();
    return out;
  };
  return diffTokens(left.split(/\r?\n/), right.split(/\r?\n/), (x, y) => norm(x) === norm(y));
}

/** Word-level diff for highlighting changes inside a modified line. */
export function diffWords(left: string, right: string) {
  const tokens = (s: string) => s.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? [];
  return diffTokens(tokens(left), tokens(right));
}

// ---- User agent

export interface ParsedUserAgent {
  browser: { name: string; version: string };
  engine: { name: string; version: string };
  os: { name: string; version: string };
  device: "Desktop" | "Mobile" | "Tablet" | "Bot" | "TV" | "Console";
  bot: boolean;
}

const find = (ua: string, pattern: RegExp) => pattern.exec(ua)?.[1]?.replace(/_/g, ".") ?? "";

export function parseUserAgent(ua: string): ParsedUserAgent {
  const bot = /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|headless|lighthouse|pingdom|curl\/|wget|python-requests|axios|postman/i.test(ua);
  const browsers: [string, RegExp][] = [
    ["Microsoft Edge", /Edg(?:e|A|iOS)?\/([\d.]+)/], ["Opera", /(?:OPR|Opera)\/([\d.]+)/], ["Samsung Internet", /SamsungBrowser\/([\d.]+)/],
    ["UC Browser", /UCBrowser\/([\d.]+)/], ["Vivaldi", /Vivaldi\/([\d.]+)/], ["Yandex Browser", /YaBrowser\/([\d.]+)/], ["Brave", /Brave\/([\d.]+)/],
    ["Firefox", /(?:Firefox|FxiOS)\/([\d.]+)/], ["Chrome", /(?:Chrome|CriOS)\/([\d.]+)/], ["Safari", /Version\/([\d.]+).*Safari/],
    ["Internet Explorer", /(?:MSIE |rv:)([\d.]+)\).*like Gecko|MSIE ([\d.]+)/], ["curl", /curl\/([\d.]+)/], ["Googlebot", /Googlebot\/([\d.]+)/], ["Bingbot", /bingbot\/([\d.]+)/],
  ];
  const [browserName, browserPattern] = browsers.find(([, pattern]) => pattern.test(ua)) ?? ["Unknown", /$^/];
  const browserMatch = browserPattern.exec(ua);
  const browser = { name: browserName, version: browserMatch?.[1] ?? browserMatch?.[2] ?? "" };

  const engine = /Gecko\/\d/.test(ua) && /Firefox|FxiOS/.test(ua) ? { name: "Gecko", version: find(ua, /rv:([\d.]+)/) }
    : /Chrome\/|CriOS|Edg\//.test(ua) ? { name: "Blink", version: find(ua, /Chrome\/([\d.]+)/) }
      : /AppleWebKit/.test(ua) ? { name: "WebKit", version: find(ua, /AppleWebKit\/([\d.]+)/) }
        : /Trident/.test(ua) ? { name: "Trident", version: find(ua, /Trident\/([\d.]+)/) } : { name: "Unknown", version: "" };

  const windows: Record<string, string> = { "10.0": "10 / 11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP" };
  const os = /Windows NT ([\d.]+)/.test(ua) ? { name: "Windows", version: windows[find(ua, /Windows NT ([\d.]+)/)] ?? find(ua, /Windows NT ([\d.]+)/) }
    : /Android/.test(ua) ? { name: "Android", version: find(ua, /Android ([\d.]+)/) }
      : /iPhone|iPad|iPod/.test(ua) ? { name: /iPad/.test(ua) ? "iPadOS" : "iOS", version: find(ua, /OS ([\d_]+)/) }
        : /CrOS/.test(ua) ? { name: "ChromeOS", version: find(ua, /CrOS \S+ ([\d.]+)/) }
          : /Mac OS X/.test(ua) ? { name: "macOS", version: find(ua, /Mac OS X ([\d_.]+)/) }
            : /Linux/.test(ua) ? { name: /Ubuntu/.test(ua) ? "Ubuntu" : "Linux", version: "" } : { name: "Unknown", version: "" };

  const device: ParsedUserAgent["device"] = bot ? "Bot"
    : /SmartTV|SMART-TV|Tizen|WebOS|AppleTV|CrKey|BRAVIA/i.test(ua) ? "TV"
      : /PlayStation|Xbox|Nintendo/i.test(ua) ? "Console"
        : /iPad|Tablet|Tab(?!le)|SM-T|Nexus (7|9|10)/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? "Tablet"
          : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua) ? "Mobile" : "Desktop";
  return { browser, engine, os, device, bot };
}

// ---- IP addresses

export interface IpInfo {
  version: 4 | 6;
  normalized: string;
  kind: string;
  isPublic: boolean;
  binary?: string;
  integer: string;
}

function parseIpv4(text: string): number[] | null {
  const parts = text.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^(0|[1-9]\d{0,2})$/.test(p) || Number(p) > 255)) return null;
  return parts.map(Number);
}

function parseIpv6(text: string): number[] | null {
  let input = text.replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  // An embedded IPv4 tail (::ffff:192.0.2.1) is two 16-bit groups.
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(input);
  if (v4) {
    const octets = parseIpv4(v4[1]);
    if (!octets) return null;
    input = `${input.slice(0, -v4[1].length)}${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }
  const halves = input.split("::");
  if (halves.length > 2) return null;
  const group = (s: string) => (s ? s.split(":") : []);
  const head = group(halves[0]);
  const rest = halves.length === 2 ? group(halves[1]) : [];
  if ([...head, ...rest].some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null;
  const known = head.length + rest.length;
  if (halves.length === 1 ? known !== 8 : known > 7) return null;
  const zeros = halves.length === 2 ? Array(8 - known).fill(0) : [];
  return [...head, ...zeros, ...rest].map((g) => (typeof g === "number" ? g : parseInt(g, 16)));
}

/** Shortest IPv6 form (RFC 5952): longest run of zero groups becomes ::. */
function compressIpv6(groups: number[]) {
  let best = { start: -1, length: 0 };
  for (let i = 0; i < 8;) {
    if (groups[i] !== 0) { i++; continue; }
    let j = i;
    while (j < 8 && groups[j] === 0) j++;
    if (j - i > best.length && j - i > 1) best = { start: i, length: j - i };
    i = j;
  }
  const hexes = groups.map((g) => g.toString(16));
  if (best.start < 0) return hexes.join(":");
  return `${hexes.slice(0, best.start).join(":")}::${hexes.slice(best.start + best.length).join(":")}`;
}

export function inspectIp(input: string): IpInfo | null {
  const text = input.trim();
  const v4 = parseIpv4(text);
  if (v4) {
    const [a, b] = v4;
    const kind = a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ? "Private (RFC 1918)"
      : a === 127 ? "Loopback" : a === 169 && b === 254 ? "Link-local" : a === 100 && b >= 64 && b <= 127 ? "Carrier-grade NAT (shared)"
        : a === 0 ? "Unspecified / “this network”" : a >= 224 && a <= 239 ? "Multicast" : a >= 240 ? (text === "255.255.255.255" ? "Broadcast" : "Reserved")
          : (a === 192 && b === 0 && v4[2] === 2) || (a === 198 && b === 51 && v4[2] === 100) || (a === 203 && b === 0 && v4[2] === 113) ? "Documentation (TEST-NET)"
            : a === 198 && (b === 18 || b === 19) ? "Benchmarking" : "Public";
    return {
      version: 4, normalized: v4.join("."), kind, isPublic: kind === "Public",
      binary: v4.map((n) => n.toString(2).padStart(8, "0")).join("."),
      integer: String(v4.reduce((acc, n) => acc * 256 + n, 0)),
    };
  }
  const v6 = parseIpv6(text);
  if (!v6) return null;
  const first = v6[0];
  const kind = v6.every((g) => g === 0) ? "Unspecified" : v6.slice(0, 7).every((g) => g === 0) && v6[7] === 1 ? "Loopback"
    : (first & 0xfe00) === 0xfc00 ? "Unique local (private)" : (first & 0xffc0) === 0xfe80 ? "Link-local" : (first & 0xff00) === 0xff00 ? "Multicast"
      : first === 0x2001 && v6[1] === 0x0db8 ? "Documentation" : v6.slice(0, 5).every((g) => g === 0) && v6[5] === 0xffff ? "IPv4-mapped"
        : (first & 0xe000) === 0x2000 ? "Public (global unicast)" : "Reserved";
  return {
    version: 6, normalized: compressIpv6(v6), kind, isPublic: kind.startsWith("Public"),
    integer: v6.reduce((acc, g) => acc * BigInt(65536) + BigInt(g), BigInt(0)).toString(),
  };
}

// ---- Email

/** Practical address syntax (RFC 5322 dot-atom local part, hostname domain with a TLD). */
const EMAIL = /^(?=.{1,254}$)(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "aol.com", "protonmail.com", "rediffmail.com", "yahoo.co.in", "zoho.com", "gmx.com", "mail.com"];

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

export interface EmailCheck {
  email: string;
  valid: boolean;
  reason?: string;
  suggestion?: string;
  domain?: string;
}

export function checkEmail(raw: string): EmailCheck {
  const email = raw.trim();
  if (!email.includes("@")) return { email, valid: false, reason: "Missing @." };
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  const local = email.slice(0, email.lastIndexOf("@"));
  if (!EMAIL.test(email)) {
    const reason = !local ? "Nothing before the @." : local.length > 64 ? "The part before @ is longer than 64 characters."
      : /\.\./.test(email) ? "Two dots in a row." : /^\.|\.@/.test(email) ? "A dot at the start or just before the @."
        : !/\./.test(domain) ? "The domain has no dot, e.g. example.com." : /\s/.test(email) ? "Contains a space."
          : "Contains characters that aren't allowed in an email address.";
    return { email, valid: false, reason, domain };
  }
  const close = COMMON_DOMAINS.find((d) => d !== domain && editDistance(d, domain) <= 2 && domain.length > 4);
  return { email, valid: true, domain, suggestion: close ? `${local}@${close}` : undefined };
}

// ---- HTTP status codes

export interface HttpStatus { code: number; name: string; meaning: string; fix?: string }

export const HTTP_STATUSES: HttpStatus[] = [
  { code: 100, name: "Continue", meaning: "The server received the request headers; the client should send the body." },
  { code: 101, name: "Switching Protocols", meaning: "The server is switching protocols as requested, e.g. to WebSocket." },
  { code: 102, name: "Processing", meaning: "WebDAV: the request was received and is still being processed." },
  { code: 103, name: "Early Hints", meaning: "Preload hints sent before the final response so the browser can start fetching resources." },
  { code: 200, name: "OK", meaning: "The request succeeded." },
  { code: 201, name: "Created", meaning: "The request succeeded and created a new resource, usually named in the Location header." },
  { code: 202, name: "Accepted", meaning: "The request was accepted for processing, which hasn't finished yet." },
  { code: 203, name: "Non-Authoritative Information", meaning: "The response was modified by a proxy." },
  { code: 204, name: "No Content", meaning: "The request succeeded and there's no body to return." },
  { code: 205, name: "Reset Content", meaning: "The client should reset the form or view that sent the request." },
  { code: 206, name: "Partial Content", meaning: "Only part of the resource is returned, in answer to a Range request." },
  { code: 207, name: "Multi-Status", meaning: "WebDAV: the body holds status codes for several resources." },
  { code: 208, name: "Already Reported", meaning: "WebDAV: members already listed earlier in the response." },
  { code: 226, name: "IM Used", meaning: "The response is the result of instance manipulations (delta encoding)." },
  { code: 300, name: "Multiple Choices", meaning: "There are several representations to choose from." },
  { code: 301, name: "Moved Permanently", meaning: "The resource has a new permanent URL, given in the Location header.", fix: "Update links and bookmarks to the new URL. Search engines transfer ranking to it." },
  { code: 302, name: "Found", meaning: "The resource is temporarily at another URL.", fix: "Use 301/308 instead if the move is permanent." },
  { code: 303, name: "See Other", meaning: "Fetch the result from another URL with GET, typically after a form POST." },
  { code: 304, name: "Not Modified", meaning: "The cached copy is still valid; no body is sent." },
  { code: 307, name: "Temporary Redirect", meaning: "Temporarily at another URL; repeat the request with the same method and body." },
  { code: 308, name: "Permanent Redirect", meaning: "Permanently at another URL; repeat the request with the same method and body." },
  { code: 400, name: "Bad Request", meaning: "The server couldn't understand the request, e.g. malformed JSON or missing fields.", fix: "Check the request body, query parameters and Content-Type header." },
  { code: 401, name: "Unauthorized", meaning: "Authentication is missing or invalid.", fix: "Sign in, or send a valid token or API key in the Authorization header." },
  { code: 402, name: "Payment Required", meaning: "Reserved; some APIs use it when a plan limit or payment is needed." },
  { code: 403, name: "Forbidden", meaning: "The server understood who you are but refuses access.", fix: "Check permissions, roles, IP allow-lists or file permissions on the server." },
  { code: 404, name: "Not Found", meaning: "Nothing exists at this URL.", fix: "Check the URL for typos, or add a redirect if the page moved." },
  { code: 405, name: "Method Not Allowed", meaning: "The URL doesn't accept this HTTP method, e.g. POST to a read-only endpoint.", fix: "Use a method listed in the response's Allow header." },
  { code: 406, name: "Not Acceptable", meaning: "The server can't produce a response matching the Accept headers." },
  { code: 407, name: "Proxy Authentication Required", meaning: "The client must authenticate with the proxy first." },
  { code: 408, name: "Request Timeout", meaning: "The server gave up waiting for the request.", fix: "Retry; check for slow uploads or network issues." },
  { code: 409, name: "Conflict", meaning: "The request conflicts with the resource's current state, e.g. an edit conflict or duplicate." },
  { code: 410, name: "Gone", meaning: "The resource was deliberately removed and won't come back." },
  { code: 411, name: "Length Required", meaning: "The request needs a Content-Length header." },
  { code: 412, name: "Precondition Failed", meaning: "A condition in the request headers (If-Match, If-Unmodified-Since) wasn't met." },
  { code: 413, name: "Content Too Large", meaning: "The request body is larger than the server allows.", fix: "Send a smaller file, or raise the server limit (e.g. client_max_body_size in nginx)." },
  { code: 414, name: "URI Too Long", meaning: "The URL is longer than the server will process.", fix: "Move large parameters into a POST body." },
  { code: 415, name: "Unsupported Media Type", meaning: "The body's format isn't supported.", fix: "Set the correct Content-Type, e.g. application/json." },
  { code: 416, name: "Range Not Satisfiable", meaning: "The requested byte range is outside the resource." },
  { code: 417, name: "Expectation Failed", meaning: "The server can't meet the Expect request header." },
  { code: 418, name: "I'm a teapot", meaning: "An April Fools' joke from RFC 2324, kept by some servers." },
  { code: 421, name: "Misdirected Request", meaning: "The request reached a server that can't answer for this host." },
  { code: 422, name: "Unprocessable Content", meaning: "The request is well-formed but its content fails validation.", fix: "Read the error details and fix the invalid fields." },
  { code: 423, name: "Locked", meaning: "WebDAV: the resource is locked." },
  { code: 424, name: "Failed Dependency", meaning: "WebDAV: the request failed because an earlier one failed." },
  { code: 425, name: "Too Early", meaning: "The server won't process a request that might be replayed." },
  { code: 426, name: "Upgrade Required", meaning: "The client must switch to another protocol, given in the Upgrade header." },
  { code: 428, name: "Precondition Required", meaning: "The request must be conditional, to prevent lost updates." },
  { code: 429, name: "Too Many Requests", meaning: "Rate limit exceeded.", fix: "Wait for the time in the Retry-After header and slow down requests." },
  { code: 431, name: "Request Header Fields Too Large", meaning: "The headers are too big, often because of large cookies.", fix: "Clear cookies for the site or send fewer headers." },
  { code: 451, name: "Unavailable For Legal Reasons", meaning: "Access is blocked for legal reasons." },
  { code: 500, name: "Internal Server Error", meaning: "The server hit an unexpected error.", fix: "Check the server logs for the exception behind it." },
  { code: 501, name: "Not Implemented", meaning: "The server doesn't support the functionality needed." },
  { code: 502, name: "Bad Gateway", meaning: "A proxy or gateway got an invalid response from the upstream server.", fix: "Check the upstream app is running and reachable from the proxy." },
  { code: 503, name: "Service Unavailable", meaning: "The server is overloaded or down for maintenance.", fix: "Retry later; check capacity, health checks and the Retry-After header." },
  { code: 504, name: "Gateway Timeout", meaning: "A proxy or gateway timed out waiting for the upstream server.", fix: "Speed up the slow request or raise the proxy timeout." },
  { code: 505, name: "HTTP Version Not Supported", meaning: "The server doesn't support the HTTP version used." },
  { code: 506, name: "Variant Also Negotiates", meaning: "A content-negotiation configuration error on the server." },
  { code: 507, name: "Insufficient Storage", meaning: "WebDAV: the server can't store what's needed." },
  { code: 508, name: "Loop Detected", meaning: "WebDAV: an infinite loop was detected." },
  { code: 510, name: "Not Extended", meaning: "Further extensions to the request are required." },
  { code: 511, name: "Network Authentication Required", meaning: "Sign in to the network first, e.g. a hotel or airport captive portal." },
];

export const STATUS_CLASSES: Record<number, string> = { 1: "Informational", 2: "Success", 3: "Redirection", 4: "Client error", 5: "Server error" };

// ---- MIME types

export const MIME_TYPES: [string, string][] = [
  ["html", "text/html"], ["htm", "text/html"], ["css", "text/css"], ["js", "text/javascript"], ["mjs", "text/javascript"], ["json", "application/json"],
  ["jsonld", "application/ld+json"], ["map", "application/json"], ["xml", "application/xml"], ["txt", "text/plain"], ["csv", "text/csv"], ["tsv", "text/tab-separated-values"],
  ["md", "text/markdown"], ["ics", "text/calendar"], ["vcf", "text/vcard"], ["yaml", "application/yaml"], ["yml", "application/yaml"], ["toml", "application/toml"],
  ["wasm", "application/wasm"], ["webmanifest", "application/manifest+json"], ["rss", "application/rss+xml"], ["atom", "application/atom+xml"],
  ["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["gif", "image/gif"], ["webp", "image/webp"], ["avif", "image/avif"], ["svg", "image/svg+xml"],
  ["ico", "image/vnd.microsoft.icon"], ["bmp", "image/bmp"], ["tif", "image/tiff"], ["tiff", "image/tiff"], ["heic", "image/heic"], ["heif", "image/heif"], ["apng", "image/apng"],
  ["mp3", "audio/mpeg"], ["wav", "audio/wav"], ["ogg", "audio/ogg"], ["oga", "audio/ogg"], ["opus", "audio/opus"], ["m4a", "audio/mp4"], ["aac", "audio/aac"], ["flac", "audio/flac"],
  ["weba", "audio/webm"], ["mid", "audio/midi"], ["midi", "audio/midi"],
  ["mp4", "video/mp4"], ["m4v", "video/mp4"], ["webm", "video/webm"], ["ogv", "video/ogg"], ["mov", "video/quicktime"], ["avi", "video/x-msvideo"], ["mkv", "video/x-matroska"],
  ["mpeg", "video/mpeg"], ["ts", "video/mp2t"], ["3gp", "video/3gpp"], ["m3u8", "application/vnd.apple.mpegurl"],
  ["woff", "font/woff"], ["woff2", "font/woff2"], ["ttf", "font/ttf"], ["otf", "font/otf"], ["eot", "application/vnd.ms-fontobject"],
  ["pdf", "application/pdf"], ["doc", "application/msword"], ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["xls", "application/vnd.ms-excel"], ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["ppt", "application/vnd.ms-powerpoint"], ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["odt", "application/vnd.oasis.opendocument.text"], ["ods", "application/vnd.oasis.opendocument.spreadsheet"], ["odp", "application/vnd.oasis.opendocument.presentation"],
  ["rtf", "application/rtf"], ["epub", "application/epub+zip"], ["zip", "application/zip"], ["gz", "application/gzip"], ["tar", "application/x-tar"],
  ["rar", "application/vnd.rar"], ["7z", "application/x-7z-compressed"], ["bz2", "application/x-bzip2"], ["xz", "application/x-xz"],
  ["jar", "application/java-archive"], ["apk", "application/vnd.android.package-archive"], ["exe", "application/vnd.microsoft.portable-executable"],
  ["msi", "application/x-msi"], ["dmg", "application/x-apple-diskimage"], ["deb", "application/vnd.debian.binary-package"], ["iso", "application/x-iso9660-image"],
  ["bin", "application/octet-stream"], ["sh", "application/x-sh"], ["php", "application/x-httpd-php"], ["py", "text/x-python"], ["java", "text/x-java-source"],
  ["c", "text/x-c"], ["cpp", "text/x-c++"], ["sql", "application/sql"], ["graphql", "application/graphql"], ["jsx", "text/jsx"], ["tsx", "text/tsx"],
  ["glb", "model/gltf-binary"], ["gltf", "model/gltf+json"], ["obj", "model/obj"], ["stl", "model/stl"], ["kml", "application/vnd.google-earth.kml+xml"],
  ["gpx", "application/gpx+xml"], ["eml", "message/rfc822"], ["p12", "application/x-pkcs12"], ["pem", "application/x-pem-file"], ["crt", "application/x-x509-ca-cert"],
];

// ---- Regex presets

export interface RegexPreset { id: string; name: string; pattern: string; flags: string; sample: string; note?: string }

export const REGEX_PRESETS: RegexPreset[] = [
  { id: "email", name: "Email address", pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", flags: "g", sample: "Write to hello@example.com or sales.team@shop.co.in" },
  { id: "url", name: "URL (http/https)", pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b[-a-zA-Z0-9()@:%_+.~#?&/=]*", flags: "g", sample: "Docs at https://example.com/docs?page=2 and http://test.org" },
  { id: "ipv4", name: "IPv4 address", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b", flags: "g", sample: "Servers 192.168.1.10 and 8.8.8.8, not 999.1.1.1" },
  { id: "ipv6", name: "IPv6 address (full or compressed)", pattern: "(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}", flags: "g", sample: "2001:db8::1 and fe80::a:b" },
  { id: "phone-in", name: "Indian mobile number", pattern: "(?:\\+91[\\s-]?|0)?[6-9]\\d{9}\\b", flags: "g", sample: "Call +91 9876543210 or 08123456789" },
  { id: "phone-intl", name: "International phone (E.164)", pattern: "\\+[1-9]\\d{6,14}\\b", flags: "g", sample: "+14155552671 and +447911123456" },
  { id: "date-iso", name: "Date YYYY-MM-DD", pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b", flags: "g", sample: "From 2024-01-31 to 2024-13-01" },
  { id: "date-dmy", name: "Date DD/MM/YYYY", pattern: "\\b(?:0[1-9]|[12]\\d|3[01])[/.-](?:0[1-9]|1[0-2])[/.-]\\d{4}\\b", flags: "g", sample: "Due 15/08/2025 or 31.12.2024" },
  { id: "time-24", name: "Time HH:MM (24-hour)", pattern: "\\b(?:[01]\\d|2[0-3]):[0-5]\\d\\b", flags: "g", sample: "Open 09:30 to 18:45" },
  { id: "hex-color", name: "HEX color", pattern: "#(?:[0-9a-fA-F]{3,4}){1,2}\\b", flags: "g", sample: "color: #1e40af; background: #fff;" },
  { id: "password", name: "Strong password (8+, upper, lower, digit, symbol)", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,}$", flags: "", sample: "Secur3!Pass", note: "Anchored: tests the whole input." },
  { id: "username", name: "Username (3–16, letters, digits, _ -)", pattern: "^[a-zA-Z0-9_-]{3,16}$", flags: "", sample: "dev_user-01" },
  { id: "slug", name: "URL slug", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", flags: "", sample: "my-blog-post-2" },
  { id: "pin-in", name: "Indian PIN code", pattern: "\\b[1-9]\\d{5}\\b", flags: "g", sample: "Pune 411001, Mumbai 400001" },
  { id: "pan", name: "Indian PAN", pattern: "\\b[A-Z]{5}\\d{4}[A-Z]\\b", flags: "g", sample: "PAN ABCDE1234F" },
  { id: "gstin", name: "GSTIN", pattern: "\\b\\d{2}[A-Z]{5}\\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\\b", flags: "g", sample: "GSTIN 27ABCDE1234F1Z5" },
  { id: "zip-us", name: "US ZIP code", pattern: "\\b\\d{5}(?:-\\d{4})?\\b", flags: "g", sample: "90210 and 10001-1234" },
  { id: "card", name: "Credit card number (13–19 digits)", pattern: "\\b(?:\\d[ -]?){13,19}\\b", flags: "g", sample: "4111 1111 1111 1111", note: "Checks the shape only, not the Luhn checksum." },
  { id: "uuid", name: "UUID", pattern: "\\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b", flags: "gi", sample: "id 550e8400-e29b-41d4-a716-446655440000" },
  { id: "html-tag", name: "HTML tag", pattern: "<\\/?([a-zA-Z][a-zA-Z0-9-]*)\\b[^>]*>", flags: "g", sample: "<p class=\"x\">Hi <b>there</b></p>" },
  { id: "number", name: "Number (integer or decimal, optional sign)", pattern: "[-+]?\\d+(?:\\.\\d+)?", flags: "g", sample: "Totals: 42, -3.5 and +0.75" },
  { id: "whitespace", name: "Leading or trailing whitespace", pattern: "^\\s+|\\s+$", flags: "gm", sample: "   padded line   " },
  { id: "duplicate-word", name: "Repeated word", pattern: "\\b(\\w+)\\s+\\1\\b", flags: "gi", sample: "This is is a test test." },
];

export function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}
