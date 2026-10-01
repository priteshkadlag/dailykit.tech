/**
 * Developer tools: formatters, encoders, generators, converters and web utilities.
 *
 * Every tool runs in the browser. The registry feeds the tool directory (lib/tools.ts),
 * the shared tool route (app/(tools)/[pdfTool]) and the renderer that picks each tool's UI.
 */

export const DEV_GROUPS = [
  { id: "dev-format", name: "Formatters & Minifiers" },
  { id: "dev-encode", name: "Encoders & Decoders" },
  { id: "dev-generate", name: "Generators" },
  { id: "dev-convert", name: "Data & Unit Converters" },
  { id: "dev-css", name: "Color & CSS" },
  { id: "dev-test", name: "Testing & Validation" },
  { id: "dev-web", name: "Web & Network" },
] as const;
export type DevGroup = (typeof DEV_GROUPS)[number]["id"];

export type DevIcon =
  | "braces" | "minimize" | "code" | "code-xml" | "database" | "link" | "binary" | "key-round" | "hash" | "shuffle" | "clock"
  | "calendar-clock" | "palette" | "contrast" | "blend" | "layers" | "square-round-corner" | "regex" | "timer" | "globe" | "monitor-smartphone"
  | "server" | "file-type" | "ruler" | "image" | "file-image" | "book-open" | "arrow-right-left" | "terminal" | "send" | "git-compare"
  | "mail" | "phone" | "network" | "scan-qr-code";

export interface DevFaq {
  question: string;
  answer: string;
}

export interface DevTool {
  slug: string;
  name: string;
  shortDescription: string;
  keywords: string[];
  icon: DevIcon;
  group: DevGroup;
  /** Page heading and meta description. */
  heading: string;
  description: string;
  faqs: DevFaq[];
}

const t = (tool: DevTool) => tool;

const PRIVATE: DevFaq = { question: "Is my data sent anywhere?", answer: "No. The tool runs entirely in your browser, so what you paste or upload stays on your device." };

export const devTools: DevTool[] = [
  // ---- Formatters & minifiers
  t({
    slug: "json-formatter", name: "JSON Formatter & Validator", icon: "braces", group: "dev-format",
    shortDescription: "Pretty-print, validate and sort JSON, with the exact line and column of any syntax error.",
    keywords: ["json formatter", "json validator", "json beautifier", "pretty print json", "json lint", "format json online"],
    heading: "JSON Formatter & Validator",
    description: "Format, validate and beautify JSON online. Choose the indentation, sort keys, and see exactly where a syntax error is.",
    faqs: [
      { question: "How do I find the error in invalid JSON?", answer: "Paste it and the validator reports the line and column where parsing stopped. Common causes are trailing commas, single quotes and unquoted keys." },
      { question: "Can it sort the keys?", answer: "Yes. Turn on Sort keys to order object keys alphabetically at every level, which makes two JSON files easier to compare." },
      PRIVATE,
    ],
  }),
  t({
    slug: "json-minifier", name: "JSON Minifier", icon: "minimize", group: "dev-format",
    shortDescription: "Strip whitespace from JSON to make it as small as possible, and see how much you saved.",
    keywords: ["json minifier", "minify json", "compress json", "json compact", "remove whitespace json"],
    heading: "JSON Minifier",
    description: "Minify JSON by removing all unnecessary whitespace and line breaks. The input is validated first, so the output is always valid JSON.",
    faqs: [
      { question: "Does minifying change the data?", answer: "No. Only spaces, tabs and line breaks between values are removed. Strings, numbers and structure stay exactly the same." },
      PRIVATE,
    ],
  }),
  t({
    slug: "html-formatter", name: "HTML Formatter", icon: "code-xml", group: "dev-format",
    shortDescription: "Beautify messy or minified HTML with consistent indentation, powered by Prettier.",
    keywords: ["html formatter", "html beautifier", "format html", "pretty print html", "indent html"],
    heading: "HTML Formatter",
    description: "Format and beautify HTML online with Prettier. Fix indentation, wrap long lines and tidy inline CSS and JavaScript.",
    faqs: [
      { question: "Which formatter does this use?", answer: "Prettier, the formatter most web projects use, running in your browser. Embedded <style> and <script> blocks are formatted too." },
      { question: "Why did whitespace between inline elements change?", answer: "HTML treats whitespace between inline elements as meaningful, so Prettier keeps it where removing it would change how the page looks." },
      PRIVATE,
    ],
  }),
  t({
    slug: "html-minifier", name: "HTML Minifier", icon: "minimize", group: "dev-format",
    shortDescription: "Remove comments and collapse whitespace in HTML while keeping <pre>, <textarea>, scripts and styles intact.",
    keywords: ["html minifier", "minify html", "compress html", "remove html comments"],
    heading: "HTML Minifier",
    description: "Minify HTML by removing comments and collapsing whitespace. Content inside <pre>, <textarea>, <script> and <style> is left untouched.",
    faqs: [
      { question: "Is it safe to minify HTML?", answer: "Collapsing runs of whitespace to a single space is safe for how browsers render HTML. The minifier leaves preformatted blocks, scripts and styles alone, and keeps conditional comments." },
      PRIVATE,
    ],
  }),
  t({
    slug: "css-formatter", name: "CSS Formatter", icon: "code", group: "dev-format",
    shortDescription: "Beautify CSS, SCSS and Less with one rule per line and consistent indentation.",
    keywords: ["css formatter", "css beautifier", "format css", "scss formatter", "less formatter"],
    heading: "CSS Formatter",
    description: "Format and beautify CSS, SCSS or Less online using Prettier, with consistent indentation and one declaration per line.",
    faqs: [
      { question: "Does it support SCSS and Less?", answer: "Yes. Pick the language before formatting so nesting, variables and mixins are handled correctly." },
      PRIVATE,
    ],
  }),
  t({
    slug: "css-minifier", name: "CSS Minifier", icon: "minimize", group: "dev-format",
    shortDescription: "Remove comments and whitespace from CSS to shrink stylesheets, keeping strings and calc() intact.",
    keywords: ["css minifier", "minify css", "compress css", "css compressor"],
    heading: "CSS Minifier",
    description: "Minify CSS by removing comments, whitespace and the last semicolon in each block, without breaking strings, URLs or calc() expressions.",
    faqs: [
      { question: "Will minified CSS behave the same?", answer: "Yes. Only comments and whitespace that CSS doesn't need are removed. Spaces that matter, such as those around + and - inside calc(), are kept." },
      PRIVATE,
    ],
  }),
  t({
    slug: "javascript-formatter", name: "JavaScript Formatter", icon: "braces", group: "dev-format",
    shortDescription: "Beautify JavaScript and TypeScript with Prettier, including minified bundles.",
    keywords: ["javascript formatter", "js beautifier", "format javascript", "typescript formatter", "unminify js"],
    heading: "JavaScript Formatter",
    description: "Format and beautify JavaScript or TypeScript online using Prettier. Choose semicolons, quote style and indentation.",
    faqs: [
      { question: "Can it un-minify a JavaScript file?", answer: "It restores readable formatting and indentation. Variable names shortened by a minifier can't be recovered." },
      PRIVATE,
    ],
  }),
  t({
    slug: "javascript-minifier", name: "JavaScript Minifier", icon: "minimize", group: "dev-format",
    shortDescription: "Minify and optionally mangle JavaScript with Terser to cut file size.",
    keywords: ["javascript minifier", "minify js", "compress javascript", "uglify js", "terser online"],
    heading: "JavaScript Minifier",
    description: "Minify JavaScript online with Terser. Remove whitespace and comments, shorten variable names, and see the size saving.",
    faqs: [
      { question: "What does mangling do?", answer: "Mangling renames local variables and functions to short names such as a and b. It saves a lot of space but makes the output hard to read, so turn it off when debugging." },
      { question: "Does it support modern JavaScript?", answer: "Yes. Terser understands current ECMAScript syntax, including modules, classes, async functions and optional chaining." },
      PRIVATE,
    ],
  }),
  t({
    slug: "xml-formatter", name: "XML Formatter & Validator", icon: "code-xml", group: "dev-format",
    shortDescription: "Validate XML for well-formedness and pretty-print it with clean indentation, or minify it.",
    keywords: ["xml formatter", "xml validator", "xml beautifier", "pretty print xml", "xml minify"],
    heading: "XML Formatter & Validator",
    description: "Check that XML is well-formed and pretty-print it with consistent indentation, or minify it to a single line.",
    faqs: [
      { question: "Does it validate against a schema?", answer: "It checks that the XML is well-formed: tags match, attributes are quoted and there's one root element. It doesn't validate against an XSD or DTD." },
      PRIVATE,
    ],
  }),
  t({
    slug: "sql-formatter", name: "SQL Formatter", icon: "database", group: "dev-format",
    shortDescription: "Beautify SQL queries for MySQL, PostgreSQL, SQL Server, SQLite and more.",
    keywords: ["sql formatter", "format sql", "sql beautifier", "pretty print sql", "mysql formatter", "postgresql formatter"],
    heading: "SQL Formatter",
    description: "Format SQL queries online. Choose your database dialect and keyword case to get clean, readable SQL.",
    faqs: [
      { question: "Which SQL dialects are supported?", answer: "Standard SQL, MySQL, MariaDB, PostgreSQL, SQL Server (T-SQL), SQLite, Oracle PL/SQL, BigQuery and more." },
      PRIVATE,
    ],
  }),

  // ---- Encoders & decoders
  t({
    slug: "url-encoder-decoder", name: "URL Encoder / Decoder", icon: "link", group: "dev-encode",
    shortDescription: "Percent-encode or decode text for URLs, as a full URL or a single query value.",
    keywords: ["url encoder", "url decoder", "percent encoding", "urlencode", "urldecode", "encodeURIComponent"],
    heading: "URL Encoder / Decoder",
    description: "Encode or decode URLs and query string values online. Switch between encoding a whole URL and encoding a single component.",
    faqs: [
      { question: "What's the difference between the two encoding modes?", answer: "Component mode (encodeURIComponent) also encodes characters like / ? & = so the text is safe inside a query value. Full URL mode (encodeURI) leaves those alone so a complete address still works." },
      { question: "Why do spaces become %20 and not +?", answer: "%20 is the standard percent-encoding for a space. The + form only applies to HTML form data; turn on the form option to use it." },
    ],
  }),
  t({
    slug: "base64-encoder-decoder", name: "Base64 Encoder / Decoder", icon: "binary", group: "dev-encode",
    shortDescription: "Encode text to Base64 or decode it back, with full UTF-8 and URL-safe Base64 support.",
    keywords: ["base64 encode", "base64 decode", "base64 converter", "base64url", "atob btoa"],
    heading: "Base64 Encoder / Decoder",
    description: "Convert text to Base64 and back online, with UTF-8 support for any language and an option for URL-safe Base64.",
    faqs: [
      { question: "Is Base64 encryption?", answer: "No. Base64 is an encoding that anyone can decode. Never use it to hide passwords or secrets." },
      { question: "What is URL-safe Base64?", answer: "It replaces + and / with - and _ and drops the = padding, so the result can go in URLs and file names. JWTs use it." },
      PRIVATE,
    ],
  }),
  t({
    slug: "html-entity-encoder-decoder", name: "HTML Entity Encoder / Decoder", icon: "code-xml", group: "dev-encode",
    shortDescription: "Escape special characters as HTML entities, or turn entities back into text.",
    keywords: ["html entity encoder", "html entity decoder", "html escape", "html unescape", "&amp;"],
    heading: "HTML Entity Encoder / Decoder",
    description: "Convert characters like < > & and quotes into HTML entities, or decode named and numeric entities back into text.",
    faqs: [
      { question: "Which characters must be escaped in HTML?", answer: "Always escape & and <. Escape > and quotes too when the text goes inside attributes. The option to encode all non-ASCII characters is useful for systems that can't handle UTF-8." },
      PRIVATE,
    ],
  }),
  t({
    slug: "jwt-decoder", name: "JWT Decoder", icon: "key-round", group: "dev-encode",
    shortDescription: "Decode a JSON Web Token's header and payload and read its expiry and issue times.",
    keywords: ["jwt decoder", "decode jwt", "jwt parser", "json web token", "jwt debugger"],
    heading: "JWT Decoder",
    description: "Decode JSON Web Tokens in your browser. See the header, payload and signature, and check when the token was issued and expires.",
    faqs: [
      { question: "Does this verify the signature?", answer: "No. Decoding only reads the token. Verifying needs the signing key, and should happen on your server." },
      { question: "Is it safe to paste a real token?", answer: "The token is decoded in your browser and never sent anywhere. Even so, treat live tokens like passwords and avoid sharing screenshots of them." },
    ],
  }),
  t({
    slug: "image-to-base64", name: "Image to Base64", icon: "file-image", group: "dev-encode",
    shortDescription: "Convert an image to a Base64 data URI for CSS, HTML or JSON.",
    keywords: ["image to base64", "base64 image encoder", "data uri", "png to base64", "jpg to base64", "svg to base64"],
    heading: "Image to Base64 Converter",
    description: "Convert PNG, JPG, GIF, WebP or SVG images to Base64 and data URIs, with ready-to-paste HTML <img> and CSS background snippets.",
    faqs: [
      { question: "When should I inline an image as Base64?", answer: "For small icons and images under a few kilobytes, inlining saves a request. For larger images, a normal file is better: Base64 is about 33% bigger and can't be cached separately." },
      PRIVATE,
    ],
  }),
  t({
    slug: "base64-to-image", name: "Base64 to Image", icon: "image", group: "dev-encode",
    shortDescription: "Preview a Base64 string or data URI as an image and download it as a file.",
    keywords: ["base64 to image", "base64 decoder image", "data uri to image", "base64 to png", "base64 to jpg"],
    heading: "Base64 to Image Converter",
    description: "Paste a Base64 string or data URI to preview the image, see its type and size, and download it.",
    faqs: [
      { question: "Do I need the data:image prefix?", answer: "No. Paste a full data URI or just the Base64 part; the tool works out the image type from the data." },
      PRIVATE,
    ],
  }),
  t({
    slug: "url-parser", name: "URL Parser", icon: "link", group: "dev-encode",
    shortDescription: "Split a URL into protocol, host, port, path, query parameters and fragment.",
    keywords: ["url parser", "parse url", "query string parser", "url components", "url splitter"],
    heading: "URL Parser",
    description: "Break any URL into its parts — protocol, host, port, path, query parameters and fragment — with decoded parameter values.",
    faqs: [
      { question: "Are query parameters decoded?", answer: "Yes. Each parameter is shown with its decoded value, and repeated parameters are listed separately." },
      PRIVATE,
    ],
  }),

  // ---- Generators
  t({
    slug: "uuid-generator", name: "UUID Generator", icon: "hash", group: "dev-generate",
    shortDescription: "Generate random v4 or time-ordered v7 UUIDs in bulk.",
    keywords: ["uuid generator", "guid generator", "uuid v4", "uuid v7", "random uuid"],
    heading: "UUID Generator",
    description: "Generate version 4 (random) or version 7 (time-ordered) UUIDs online, up to 1,000 at a time, in the format you need.",
    faqs: [
      { question: "Should I use UUID v4 or v7?", answer: "v4 is fully random. v7 starts with a timestamp, so new IDs sort after old ones — better for database primary keys because inserts stay in index order." },
      { question: "Are these UUIDs secure?", answer: "They're generated with your browser's cryptographic random number generator (crypto.getRandomValues)." },
    ],
  }),
  t({
    slug: "random-string-generator", name: "Random String Generator", icon: "shuffle", group: "dev-generate",
    shortDescription: "Create random strings, tokens and IDs with the characters and length you choose.",
    keywords: ["random string generator", "random token", "random id", "api key generator", "random characters"],
    heading: "Random String Generator",
    description: "Generate cryptographically random strings for tokens, IDs and test data. Pick the length, character sets and how many to create.",
    faqs: [
      { question: "Are the strings truly random?", answer: "They use crypto.getRandomValues with rejection sampling, so every allowed character is equally likely." },
      PRIVATE,
    ],
  }),
  t({
    slug: "hash-generator", name: "Hash Generator", icon: "hash", group: "dev-generate",
    shortDescription: "Compute MD5, SHA-1, SHA-256 and SHA-512 hashes of text or files.",
    keywords: ["hash generator", "md5 generator", "sha256 generator", "sha1", "sha512", "checksum", "file hash"],
    heading: "Hash Generator — MD5, SHA-1, SHA-256, SHA-512",
    description: "Generate MD5, SHA-1, SHA-256 and SHA-512 hashes of text or a file, in hex or Base64, all at once.",
    faqs: [
      { question: "Can I use MD5 or SHA-1 for passwords?", answer: "No. They're fast and broken for security use. Use them for checksums; store passwords with bcrypt, scrypt or Argon2." },
      { question: "How do I verify a download?", answer: "Choose the file and compare its SHA-256 with the checksum the publisher lists. The file is hashed on your device and never uploaded." },
    ],
  }),
  t({
    slug: "unix-timestamp-generator", name: "Unix Timestamp Generator", icon: "calendar-clock", group: "dev-generate",
    shortDescription: "Get the current Unix time, or turn any date and time into a timestamp in seconds or milliseconds.",
    keywords: ["unix timestamp generator", "current timestamp", "epoch time now", "date to timestamp", "epoch generator"],
    heading: "Unix Timestamp Generator",
    description: "See the current Unix timestamp live, or pick a date and time to get its epoch value in seconds and milliseconds, with code snippets.",
    faqs: [
      { question: "What is a Unix timestamp?", answer: "The number of seconds since 1 January 1970 at 00:00:00 UTC. It's the same everywhere in the world at a given moment." },
      { question: "Seconds or milliseconds?", answer: "Unix tools and most databases use seconds (10 digits today). JavaScript's Date.now() and Java use milliseconds (13 digits)." },
    ],
  }),
  t({
    slug: "cron-expression-generator", name: "Cron Expression Generator", icon: "timer", group: "dev-generate",
    shortDescription: "Build a cron schedule, read it in plain English and see its next run times.",
    keywords: ["cron expression generator", "crontab generator", "cron schedule", "cron builder", "cron explainer"],
    heading: "Cron Expression Generator",
    description: "Build or paste a five-field cron expression, read what it means in plain English, and preview the next times it will run.",
    faqs: [
      { question: "What do the five fields mean?", answer: "Minute (0–59), hour (0–23), day of month (1–31), month (1–12) and day of week (0–6, Sunday = 0). * means every value, */n every n, a-b a range and a,b a list." },
      { question: "What happens when both day fields are set?", answer: "Standard cron runs when either the day of month or the day of week matches, and the preview follows that rule." },
    ],
  }),
  t({
    slug: "regex-generator", name: "Regex Generator", icon: "regex", group: "dev-generate",
    shortDescription: "Pick a ready-made regular expression for emails, URLs, dates, phones and more, and test it.",
    keywords: ["regex generator", "regular expression generator", "regex builder", "email regex", "url regex", "common regex patterns"],
    heading: "Regex Generator",
    description: "Build regular expressions from a library of tested patterns — email, URL, IP address, dates, phone numbers, passwords and more — and try them on your own text.",
    faqs: [
      { question: "Can a regex fully validate an email address?", answer: "Not completely. The pattern here accepts normal addresses and rejects obvious mistakes, but the only real test is sending a message." },
      PRIVATE,
    ],
  }),
  t({
    slug: "curl-generator", name: "cURL Generator", icon: "terminal", group: "dev-generate",
    shortDescription: "Build a cURL command from a method, URL, headers and body, ready to paste in a terminal.",
    keywords: ["curl generator", "curl command builder", "curl builder", "generate curl", "curl post json"],
    heading: "cURL Command Generator",
    description: "Build cURL commands without memorising flags. Set the method, URL, headers, authentication and body, and copy the command.",
    faqs: [
      { question: "Will the command work on Windows?", answer: "Choose the Windows (cmd) quoting option: it uses double quotes and escapes inner ones. PowerShell users should call curl.exe rather than the curl alias." },
      PRIVATE,
    ],
  }),

  // ---- Data & unit converters
  t({
    slug: "timestamp-converter", name: "Timestamp Converter", icon: "clock", group: "dev-convert",
    shortDescription: "Convert Unix timestamps to readable dates in UTC and your time zone, and dates back to timestamps.",
    keywords: ["timestamp converter", "epoch converter", "unix time to date", "timestamp to date", "date to epoch"],
    heading: "Timestamp Converter",
    description: "Convert Unix timestamps in seconds, milliseconds or microseconds to human dates in UTC, your local time and ISO 8601 — or a date back to a timestamp.",
    faqs: [
      { question: "How does it know whether my timestamp is in seconds or milliseconds?", answer: "It looks at the number of digits: 10 digits is seconds, 13 is milliseconds and 16 is microseconds. You can override the unit." },
      PRIVATE,
    ],
  }),
  t({
    slug: "number-base-converter", name: "Number Base Converter", icon: "binary", group: "dev-convert",
    shortDescription: "Convert numbers between binary, octal, decimal, hexadecimal and any base from 2 to 36.",
    keywords: ["number base converter", "binary to decimal", "hex to decimal", "decimal to binary", "octal converter", "radix converter"],
    heading: "Number Base Converter",
    description: "Convert whole numbers of any size between binary, octal, decimal, hexadecimal and any base from 2 to 36.",
    faqs: [
      { question: "Is there a size limit?", answer: "No practical one: numbers are handled as BigInt, so long binary or hex values convert exactly." },
      PRIVATE,
    ],
  }),
  t({
    slug: "file-size-converter", name: "File Size Converter", icon: "ruler", group: "dev-convert",
    shortDescription: "Convert between bytes, KB, MB, GB and TB in both decimal (1000) and binary (1024) units.",
    keywords: ["file size converter", "mb to gb", "bytes converter", "kib mib", "data size converter"],
    heading: "File Size Converter",
    description: "Convert data sizes between bytes, KB, MB, GB, TB and PB, in decimal (SI) and binary (IEC, KiB/MiB) units side by side.",
    faqs: [
      { question: "Is 1 KB 1000 or 1024 bytes?", answer: "Both are used. In SI units 1 KB = 1000 bytes; in binary units 1 KiB = 1024 bytes. Windows labels binary sizes as KB, which is why a 500 GB drive shows about 465 GB." },
    ],
  }),
  t({
    slug: "csv-to-json", name: "CSV to JSON Converter", icon: "arrow-right-left", group: "dev-convert",
    shortDescription: "Convert CSV to a JSON array of objects, with quoted fields, custom delimiters and type detection.",
    keywords: ["csv to json", "convert csv to json", "csv parser", "csv json converter"],
    heading: "CSV to JSON Converter",
    description: "Convert CSV data to JSON online. Handles quoted fields, commas and line breaks inside values, custom delimiters, and numbers and booleans.",
    faqs: [
      { question: "What if my CSV uses semicolons or tabs?", answer: "Pick the delimiter, or leave it on Auto and the converter detects comma, semicolon, tab or pipe from the first line." },
      PRIVATE,
    ],
  }),
  t({
    slug: "json-to-csv", name: "JSON to CSV Converter", icon: "arrow-right-left", group: "dev-convert",
    shortDescription: "Turn a JSON array into CSV for Excel or Google Sheets, flattening nested objects.",
    keywords: ["json to csv", "convert json to csv", "json to excel", "json csv converter"],
    heading: "JSON to CSV Converter",
    description: "Convert a JSON array of objects to CSV. Nested objects become dotted columns, and values are quoted where needed so spreadsheets open them correctly.",
    faqs: [
      { question: "How are nested objects handled?", answer: "They're flattened into columns such as address.city. Arrays are written as JSON text in a single cell." },
      PRIVATE,
    ],
  }),
  t({
    slug: "json-to-yaml", name: "JSON to YAML Converter", icon: "arrow-right-left", group: "dev-convert",
    shortDescription: "Convert JSON to clean, readable YAML for config files.",
    keywords: ["json to yaml", "convert json to yaml", "json yaml converter"],
    heading: "JSON to YAML Converter",
    description: "Convert JSON to YAML online for Kubernetes, Docker Compose, GitHub Actions and other config files.",
    faqs: [PRIVATE],
  }),
  t({
    slug: "yaml-to-json", name: "YAML to JSON Converter", icon: "arrow-right-left", group: "dev-convert",
    shortDescription: "Convert YAML to JSON and catch YAML syntax errors with their line numbers.",
    keywords: ["yaml to json", "convert yaml to json", "yaml parser", "yaml validator"],
    heading: "YAML to JSON Converter",
    description: "Convert YAML to formatted JSON online, with clear error messages that point to the line with the problem.",
    faqs: [
      { question: "Does it support multiple YAML documents?", answer: "Yes. Files with several documents separated by --- become a JSON array with one entry per document." },
      PRIVATE,
    ],
  }),
  t({
    slug: "xml-to-json", name: "XML to JSON Converter", icon: "arrow-right-left", group: "dev-convert",
    shortDescription: "Convert XML to JSON, keeping attributes and turning repeated elements into arrays.",
    keywords: ["xml to json", "convert xml to json", "xml parser", "xml json converter", "rss to json"],
    heading: "XML to JSON Converter",
    description: "Convert XML to clean, formatted JSON online. Attributes, repeated elements, CDATA and entities are handled, and malformed XML is reported with its line number.",
    faqs: [
      { question: "How are attributes and text represented?", answer: "Attributes become keys starting with @ (id=\"5\" → \"@id\": 5). An element with only text becomes a plain value; if it also has attributes or child elements, its text is stored under \"#text\"." },
      { question: "What happens to repeated elements?", answer: "Elements that appear more than once under the same parent, like several <item> tags, become a JSON array. A single element stays an object, so check for both if your data can contain one or many." },
      { question: "Are comments and the XML declaration kept?", answer: "No. Comments, processing instructions and the DOCTYPE have no JSON equivalent and are skipped. CDATA sections are kept as text." },
      PRIVATE,
    ],
  }),
  t({
    slug: "markdown-to-html", name: "Markdown to HTML Converter", icon: "book-open", group: "dev-convert",
    shortDescription: "Convert Markdown, including GitHub tables and task lists, to clean HTML code.",
    keywords: ["markdown to html", "md to html", "convert markdown", "markdown converter"],
    heading: "Markdown to HTML Converter",
    description: "Convert Markdown to HTML online, with GitHub-flavoured tables, task lists and fenced code blocks. Copy the HTML or download it as a file.",
    faqs: [PRIVATE],
  }),

  // ---- Color & CSS
  t({
    slug: "hex-to-rgb", name: "HEX to RGB Converter", icon: "palette", group: "dev-css",
    shortDescription: "Convert HEX color codes to RGB, RGBA, HSL and CSS values.",
    keywords: ["hex to rgb", "hex to rgba", "color converter", "hex color code"],
    heading: "HEX to RGB Converter",
    description: "Convert HEX color codes (#RGB, #RRGGBB and #RRGGBBAA) to RGB, RGBA and HSL, with a live preview and copy-ready CSS.",
    faqs: [{ question: "What about 3-digit HEX codes?", answer: "Short codes like #0af expand by doubling each digit to #00aaff. 4- and 8-digit codes include alpha transparency." }],
  }),
  t({
    slug: "rgb-to-hex", name: "RGB to HEX Converter", icon: "palette", group: "dev-css",
    shortDescription: "Convert RGB or RGBA values to HEX color codes.",
    keywords: ["rgb to hex", "rgba to hex", "color converter", "rgb color code"],
    heading: "RGB to HEX Converter",
    description: "Convert RGB and RGBA color values to HEX codes, with a live preview and HSL output.",
    faqs: [{ question: "How is alpha converted?", answer: "An alpha below 1 adds a fourth pair of hex digits, e.g. rgba(0, 170, 255, 0.5) becomes #00aaff80." }],
  }),
  t({
    slug: "hsl-to-hex", name: "HSL to HEX Converter", icon: "palette", group: "dev-css",
    shortDescription: "Convert HSL colors to HEX and RGB.",
    keywords: ["hsl to hex", "hsl to rgb", "color converter", "hsl color"],
    heading: "HSL to HEX Converter",
    description: "Convert HSL and HSLA colors to HEX and RGB, with sliders to adjust hue, saturation and lightness.",
    faqs: [{ question: "Why use HSL?", answer: "HSL describes color the way people think about it — hue, how vivid, how light — so it's easy to make lighter or darker shades of the same color." }],
  }),
  t({
    slug: "color-contrast-checker", name: "Color Contrast Checker", icon: "contrast", group: "dev-css",
    shortDescription: "Check text and background colors against WCAG AA and AAA contrast requirements.",
    keywords: ["color contrast checker", "wcag contrast", "contrast ratio", "accessibility color checker", "a11y contrast"],
    heading: "Color Contrast Checker",
    description: "Check the contrast ratio between text and background colors, and see whether they pass WCAG 2 AA and AAA for normal and large text.",
    faqs: [
      { question: "What contrast ratio do I need?", answer: "WCAG AA needs 4.5:1 for normal text and 3:1 for large text (24 px, or 18.5 px bold). AAA needs 7:1 and 4.5:1." },
    ],
  }),
  t({
    slug: "css-gradient-generator", name: "CSS Gradient Generator", icon: "blend", group: "dev-css",
    shortDescription: "Design linear, radial and conic CSS gradients visually and copy the code.",
    keywords: ["css gradient generator", "linear gradient", "radial gradient", "gradient maker", "background gradient"],
    heading: "CSS Gradient Generator",
    description: "Create linear, radial and conic CSS gradients with multiple color stops, a live preview and copy-ready CSS.",
    faqs: [{ question: "Do gradients work in all browsers?", answer: "Linear and radial gradients work in every current browser without prefixes. Conic gradients work in all current browsers too." }],
  }),
  t({
    slug: "box-shadow-generator", name: "Box Shadow Generator", icon: "layers", group: "dev-css",
    shortDescription: "Build layered CSS box shadows with a live preview.",
    keywords: ["box shadow generator", "css box shadow", "shadow generator", "drop shadow css"],
    heading: "CSS Box Shadow Generator",
    description: "Design CSS box shadows visually — offset, blur, spread, color and inset — stack several layers and copy the CSS.",
    faqs: [{ question: "How do I make a soft, realistic shadow?", answer: "Stack two or three shadows with low opacity: a tight one for contact and a larger, blurrier one for depth. Start from a preset and adjust." }],
  }),
  t({
    slug: "border-radius-generator", name: "CSS Border Radius Generator", icon: "square-round-corner", group: "dev-css",
    shortDescription: "Round each corner separately, including elliptical corners, and copy the CSS.",
    keywords: ["border radius generator", "css border radius", "rounded corners css", "blob shape css"],
    heading: "CSS Border Radius Generator",
    description: "Set the border radius of each corner, in pixels or percent, with elliptical corners for blob shapes, and copy the shortest CSS.",
    faqs: [{ question: "How do I make a circle?", answer: "Set every corner to 50% on a square element." }],
  }),

  // ---- Testing & validation
  t({
    slug: "regex-tester", name: "Regex Tester", icon: "regex", group: "dev-test",
    shortDescription: "Test JavaScript regular expressions live, with highlighted matches, groups and replace.",
    keywords: ["regex tester", "regular expression tester", "regex101 alternative", "test regex online", "regex match"],
    heading: "Regex Tester",
    description: "Test regular expressions against your text in real time. See every match highlighted, capture groups, and a replace preview.",
    faqs: [
      { question: "Which regex flavour is this?", answer: "JavaScript (ECMAScript), as used in browsers and Node.js, including named groups, lookbehind and the u, s, y and d flags." },
      PRIVATE,
    ],
  }),
  t({
    slug: "diff-checker", name: "Diff Checker", icon: "git-compare", group: "dev-test",
    shortDescription: "Compare two texts line by line and see additions, removals and changed words.",
    keywords: ["diff checker", "text compare", "compare text online", "diff tool", "code diff"],
    heading: "Diff Checker",
    description: "Compare two pieces of text or code and highlight what was added, removed and changed, side by side or inline.",
    faqs: [
      { question: "Can it ignore whitespace?", answer: "Yes. Turn on Ignore whitespace to skip changes in indentation and spacing, or Ignore case for letter case." },
      PRIVATE,
    ],
  }),
  t({
    slug: "markdown-editor", name: "Markdown Editor & Previewer", icon: "book-open", group: "dev-test",
    shortDescription: "Write Markdown with a live side-by-side preview, and export HTML.",
    keywords: ["markdown editor", "markdown previewer", "markdown online", "md editor", "readme editor"],
    heading: "Markdown Editor & Previewer",
    description: "Write Markdown with a live preview, including GitHub tables, task lists and code blocks. Your draft is kept in this browser.",
    faqs: [
      { question: "Is my document saved?", answer: "It's kept in your browser's local storage so it survives a refresh. Nothing is uploaded; download the .md or .html to keep a copy." },
    ],
  }),
  t({
    slug: "email-validator", name: "Email Validator", icon: "mail", group: "dev-test",
    shortDescription: "Check email address syntax, spot typos in common domains, and look up the domain's mail servers.",
    keywords: ["email validator", "email checker", "validate email", "email syntax check", "mx record check"],
    heading: "Email Validator",
    description: "Validate email addresses in bulk: check the syntax, catch typos like gmial.com, and confirm the domain has mail (MX) records.",
    faqs: [
      { question: "Does it tell me whether a mailbox exists?", answer: "No tool can reliably confirm a mailbox without emailing it. This checks the address is well-formed and that its domain accepts mail." },
      { question: "What is sent over the network?", answer: "Only the domain names, for the MX lookup, which goes to Cloudflare's public DNS. The part before the @ never leaves your browser." },
    ],
  }),
  t({
    slug: "phone-number-formatter", name: "Phone Number Formatter", icon: "phone", group: "dev-test",
    shortDescription: "Validate phone numbers and format them in international, national, E.164 and tel: forms.",
    keywords: ["phone number formatter", "phone validator", "e164 format", "international phone format", "phone number checker"],
    heading: "Phone Number Formatter & Validator",
    description: "Validate and format phone numbers for any country: international, national, E.164 and tel: link formats, plus the number type.",
    faqs: [
      { question: "What is E.164?", answer: "The international standard format: a + followed by the country code and number, with no spaces, such as +919876543210. Most APIs and SMS services expect it." },
      PRIVATE,
    ],
  }),
  t({
    slug: "api-request-builder", name: "API Request Builder", icon: "send", group: "dev-test",
    shortDescription: "Send HTTP requests from your browser and inspect the status, headers and body.",
    keywords: ["api request builder", "api tester", "rest client online", "http request tester", "postman alternative"],
    heading: "API Request Builder",
    description: "Build and send HTTP requests from your browser — method, headers, query parameters and body — then inspect the response and copy the code as cURL or fetch.",
    faqs: [
      { question: "Why do some requests fail with a CORS error?", answer: "Browsers only let a page read responses from APIs that allow it with CORS headers. Public APIs usually do; for others, copy the cURL command and run it in a terminal." },
      { question: "Do requests go through your server?", answer: "No. They go straight from your browser to the API, so your keys and data never pass through us." },
    ],
  }),

  // ---- Web & network
  t({
    slug: "ip-address-checker", name: "IP Address Checker", icon: "network", group: "dev-web",
    shortDescription: "See your public IP address, and check whether any IP is public, private, reserved, IPv4 or IPv6.",
    keywords: ["what is my ip", "ip address checker", "my ip address", "ip lookup", "ipv6 checker", "private ip check"],
    heading: "IP Address Checker",
    description: "See the public IP address your connection uses, and check any IPv4 or IPv6 address: whether it's valid, public or private, and its binary and integer forms.",
    faqs: [
      { question: "Why is my IP different from my computer's settings?", answer: "Your router gives devices private addresses such as 192.168.x.x. Websites see the public address of your router, or of your VPN or mobile network." },
    ],
  }),
  t({
    slug: "user-agent-parser", name: "User Agent Parser", icon: "monitor-smartphone", group: "dev-web",
    shortDescription: "Identify the browser, engine, operating system and device type from a user agent string.",
    keywords: ["user agent parser", "what is my user agent", "ua parser", "browser detection", "user agent string"],
    heading: "User Agent Parser",
    description: "Parse any user agent string to find the browser and version, rendering engine, operating system and device type. Starts with your own.",
    faqs: [
      { question: "Why does every browser say Mozilla?", answer: "For historical compatibility, nearly all browsers start their user agent with Mozilla/5.0. The real browser is identified by later tokens such as Chrome/, Firefox/ or Edg/." },
      PRIVATE,
    ],
  }),
  t({
    slug: "http-status-codes", name: "HTTP Status Code Checker", icon: "server", group: "dev-web",
    shortDescription: "Check the live status code and redirect chain of any URL, or look up what a code means.",
    keywords: ["http status codes", "http status code checker", "check url status", "redirect checker", "404 meaning", "500 error", "http response codes", "status code list"],
    heading: "HTTP Status Code Checker",
    description: "Check the HTTP status code of any public URL and follow its redirect chain, or look up every status code from 1xx to 5xx with what it means and how to fix it.",
    faqs: [
      { question: "What's the difference between 401 and 403?", answer: "401 Unauthorized means you aren't signed in or your credentials are missing. 403 Forbidden means the server knows who you are but won't let you in." },
      { question: "Should I use 301 or 302 for a redirect?", answer: "Use 301 (or 308) when a page has moved for good, so search engines update their index. Use 302 (or 307) for temporary moves." },
      { question: "How does the URL check work?", answer: "Our server sends a HEAD request (or GET if the site doesn't support HEAD), reads only the status line and headers, and follows up to five redirects. Nothing about the URL is stored. Private, local and reserved network addresses are refused." },
      { question: "Why does the checker show a different code than my browser?", answer: "Some sites answer automated requests differently — for example blocking them with 403, or serving a bot challenge — and pages that need you to be signed in will redirect to a login page." },
    ],
  }),
  t({
    slug: "mime-type-lookup", name: "MIME Type Lookup", icon: "file-type", group: "dev-web",
    shortDescription: "Find the MIME type for a file extension, or the extensions for a MIME type.",
    keywords: ["mime type lookup", "content type", "file extension mime", "mime types list", "media type"],
    heading: "MIME Type Lookup",
    description: "Look up the correct MIME (Content-Type) for any file extension, or the extensions that use a MIME type. You can also check a file on your device.",
    faqs: [{ question: "What MIME type should I use for unknown files?", answer: "application/octet-stream. It tells the browser to download the file rather than try to display it." }],
  }),
  t({
    slug: "dns-lookup", name: "Domain / DNS Lookup", icon: "globe", group: "dev-web",
    shortDescription: "Look up A, AAAA, MX, TXT, NS, CNAME and other DNS records for any domain.",
    keywords: ["dns lookup", "domain lookup", "mx lookup", "txt record lookup", "nslookup online", "dns checker"],
    heading: "Domain / DNS Lookup",
    description: "Look up a domain's DNS records — A, AAAA, CNAME, MX, TXT, NS, SOA, CAA and more — using DNS-over-HTTPS.",
    faqs: [
      { question: "Where do the answers come from?", answer: "From Cloudflare's public resolver (1.1.1.1) over DNS-over-HTTPS. Only the domain name you look up is sent." },
      { question: "Why don't I see a change I just made?", answer: "Resolvers cache records for the time-to-live (TTL) shown next to each answer. Wait for the TTL to pass and try again." },
    ],
  }),
  t({
    slug: "qr-code-scanner", name: "QR Code Scanner", icon: "scan-qr-code", group: "dev-web",
    shortDescription: "Read QR codes from your camera or an image, in the browser.",
    keywords: ["qr code scanner", "scan qr code online", "qr reader", "read qr from image", "qr decoder"],
    heading: "QR Code Scanner",
    description: "Scan QR codes with your camera or upload a screenshot or photo. Links, WiFi details and text are decoded in your browser.",
    faqs: [
      { question: "Is the camera image uploaded?", answer: "No. Frames are decoded on your device and nothing is recorded or sent." },
      { question: "Is it safe to open a scanned link?", answer: "Check the address before opening it. QR codes can point anywhere, and the scanner shows the full link first." },
    ],
  }),
];

/** Existing tools that also belong in the developer category. */
export const DEV_EXTRAS: Record<string, DevGroup> = { "color-picker": "dev-css", "case-converter": "dev-test", "qr-code-generator": "dev-generate" };

const bySlug = new Map(devTools.map((tool) => [tool.slug, tool]));
export const getDevTool = (slug: string) => bySlug.get(slug);

export const devToolEntries = devTools.map((tool) => ({
  slug: tool.slug,
  name: tool.name,
  shortDescription: tool.shortDescription,
  categories: ["developer-tools"] as ["developer-tools"],
  keywords: tool.keywords,
  icon: tool.icon,
  status: "live" as const,
  group: tool.group,
}));
