import { describe, expect, it } from "vitest";
import {
  base64Decode, base64Encode, decodeEntities, decodeJwt, encodeEntities, formatJson, formatXml, minifyCss, minifyHtml, minifyJson, minifyXml,
  parseJson, urlDecode, urlEncode, validateXml,
} from "@/lib/dev-tools/code";
import {
  contrastRatio, convertSize, csvToJson, formatHsl, formatRgb, groupDigits, guessTimestampUnit, hslToRgb, jsonToCsv, parseBigInt, parseColor, parseCsv,
  parseHex, rgbToHsl, timestampToDate, toBase, toHex,
  splitIdentifier, toCodeCase,
} from "@/lib/dev-tools/convert";
import { buildCurl, buildFetch, describeCron, formatUuid, hashBytes, md5, nextCronRuns, parseCron, randomString, uuidV4, uuidV7 } from "@/lib/dev-tools/generate";
import { checkEmail, diffLines, diffWords, inspectIp, parseUserAgent, REGEX_PRESETS } from "@/lib/dev-tools/web";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("JSON", () => {
  it("formats, sorts and minifies", () => {
    expect(formatJson('{"b":1,"a":[1,2]}', 2, true)).toEqual({ ok: true, value: '{\n  "a": [\n    1,\n    2\n  ],\n  "b": 1\n}' });
    expect(minifyJson('{ "a" : [ 1 , 2 ] }')).toEqual({ ok: true, value: '{"a":[1,2]}' });
  });
  it("reports the line and column of errors", () => {
    const result = parseJson('{\n  "a": 1,\n}');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/^Line 3, column 1/);
  });
});

describe("XML", () => {
  it("formats nested XML and keeps simple elements on one line", () => {
    expect(formatXml('<?xml version="1.0"?><root><a x="1">hi</a><b/><c><d>1</d></c></root>')).toEqual({
      ok: true, value: '<?xml version="1.0"?>\n<root>\n  <a x="1">hi</a>\n  <b/>\n  <c>\n    <d>1</d>\n  </c>\n</root>',
    });
    expect(minifyXml("<a>\n  <b> x </b>\n  <!-- note -->\n</a>")).toEqual({ ok: true, value: "<a><b>x</b></a>" });
  });
  it("catches mismatched and unclosed tags", () => {
    expect(validateXml("<a><b></a>")).toMatchObject({ ok: false, error: expect.stringContaining("expected </b>") });
    expect(validateXml("<a>")).toMatchObject({ ok: false, error: expect.stringContaining("never closed") });
    expect(validateXml("<a x=1></a>")).toMatchObject({ ok: false, error: expect.stringContaining("quoted") });
    expect(validateXml("<a/><b/>")).toMatchObject({ ok: false, error: expect.stringContaining("one root") });
  });
});

describe("minifiers", () => {
  it("minifies CSS without breaking strings or calc()", () => {
    const css = "/* c */\n.a  >  .b {\n  color : red ;\n  width: calc(100% - 2rem);\n  content: \"a  b\";\n}\n@media (min-width: 600px) { .c { margin: 0 auto; } }";
    expect(minifyCss(css)).toBe('.a>.b{color:red;width:calc(100% - 2rem);content:"a  b"}@media (min-width:600px){.c{margin:0 auto}}');
    expect(minifyCss("/*! keep */ a { b: c }")).toBe("/*! keep */a{b:c}");
  });
  it("minifies HTML but keeps pre and script", () => {
    const html = "<div>\n  <!-- note -->\n  <p>Hello   <b>world</b></p>\n  <pre>  keep\n  this</pre>\n  <script> if (a  <  b) {} </script>\n</div>";
    expect(minifyHtml(html)).toBe("<div><p>Hello <b>world</b></p><pre>  keep\n  this</pre> <script> if (a  <  b) {} </script></div>");
  });
});

describe("encoders", () => {
  it("round-trips UTF-8 Base64, including URL-safe", () => {
    expect(base64Encode("héllo ✓")).toBe("aMOpbGxvIOKckw==");
    expect(base64Decode("aMOpbGxvIOKckw==")).toEqual({ ok: true, value: "héllo ✓" });
    expect(base64Encode("??>", true)).toBe("Pz8-");
    expect(base64Decode("Pz8-")).toEqual({ ok: true, value: "??>" });
    expect(base64Decode("not base64!").ok).toBe(false);
  });
  it("encodes URLs in component and full modes", () => {
    expect(urlEncode("a b&c=d/é", "component")).toBe("a%20b%26c%3Dd%2F%C3%A9");
    expect(urlEncode("https://x.com/a b?q=1&r=2", "uri")).toBe("https://x.com/a%20b?q=1&r=2");
    expect(urlEncode("a b", "component", true)).toBe("a+b");
    expect(urlDecode("a+b%20c", true)).toEqual({ ok: true, value: "a b c" });
    expect(urlDecode("%zz").ok).toBe(false);
  });
  it("encodes and decodes HTML entities", () => {
    expect(encodeEntities("<a href=\"x\">Tom & Jerry's</a>")).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;");
    expect(encodeEntities("© é 😀", { nonAscii: true })).toBe("&copy; &eacute; &#128512;");
    expect(decodeEntities("&lt;p&gt; &amp;amp; &#169; &#x1F600; &hellip; &bogus;")).toBe("<p> &amp; © 😀 … &bogus;");
  });
  it("decodes JWTs and their time claims", () => {
    const token = `${base64Encode(JSON.stringify({ alg: "HS256", typ: "JWT" }), true)}.${base64Encode(JSON.stringify({ sub: "1", iat: 1700000000, exp: 1700003600 }), true)}.sig`;
    const result = decodeJwt(`Bearer ${token}`, 1800000000000);
    expect(result.ok && result.value.header.alg).toBe("HS256");
    expect(result.ok && result.value.expired).toBe(true);
    expect(result.ok && result.value.times.map((t) => t.claim)).toEqual(["iat", "exp"]);
    expect(decodeJwt("a.b").ok).toBe(false);
  });
});

describe("generators", () => {
  it("makes valid v4 and v7 UUIDs", () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const v7 = uuidV7(0x0189_0000_0000);
    expect(v7).toMatch(/^01890000-0000-7[0-9a-f]{3}-[89ab]/);
    expect(formatUuid("ab-cd", "no-dashes")).toBe("abcd");
  });
  it("draws random strings from the alphabet only", () => {
    const s = randomString(200, "ab");
    expect(s).toHaveLength(200);
    expect(s).toMatch(/^[ab]+$/);
  });
  it("hashes with the standard test vectors", async () => {
    expect(md5(bytes(""))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5(bytes("abc"))).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(md5(bytes("The quick brown fox jumps over the lazy dog"))).toBe("9e107d9d372bb6826bd81d3542a419d6");
    expect(md5(bytes("a".repeat(1000)))).toBe("cabe45dcc9ae5b66ba86600cca6b8ba8");
    expect(await hashBytes("SHA-256", bytes("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await hashBytes("SHA-1", bytes("abc"))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });
  it("parses, describes and schedules cron expressions", () => {
    const weekdays = parseCron("30 9 * * 1-5");
    expect(weekdays.ok && describeCron(weekdays.value)).toBe("At 09:30, on Monday through Friday.");
    const every15 = parseCron("*/15 * * * *");
    expect(every15.ok && describeCron(every15.value)).toBe("Every 15 minutes.");
    const daily = parseCron("@daily");
    expect(daily.ok && describeCron(daily.value)).toBe("At 00:00.");
    const monthly = parseCron("0 12 1 JAN,JUL *");
    expect(monthly.ok && describeCron(monthly.value)).toBe("At 12:00, on the 1st of the month, in January and July.");
    expect(parseCron("61 * * * *").ok).toBe(false);
    expect(parseCron("* * *").ok).toBe(false);
    // Friday 2024-03-01 10:00 local → next weekday 09:30 runs.
    const runs = weekdays.ok ? nextCronRuns(weekdays.value, new Date(2024, 2, 1, 10, 0), 3) : [];
    expect(runs.map((d) => [d.getDate(), d.getHours(), d.getMinutes()])).toEqual([[4, 9, 30], [5, 9, 30], [6, 9, 30]]);
    // Day-of-month OR day-of-week.
    const either = parseCron("0 0 13 * 5");
    const hits = either.ok ? nextCronRuns(either.value, new Date(2024, 0, 1), 4) : [];
    expect(hits.map((d) => d.getDate())).toEqual([5, 12, 13, 19]);
  });
  it("builds cURL and fetch commands", () => {
    const request = { method: "POST", url: "https://api.example.com/items", headers: [{ name: "Content-Type", value: "application/json" }], body: '{"name":"it\'s"}', auth: { type: "bearer" as const, token: "abc" } };
    expect(buildCurl(request, "posix", false)).toBe(`curl https://api.example.com/items -X POST -H 'Content-Type: application/json' -H 'Authorization: Bearer abc' --data-raw '{"name":"it'\\''s"}'`);
    expect(buildCurl(request, "cmd", false)).toContain(`--data-raw "{\\"name\\":\\"it's\\"}"`);
    expect(buildFetch(request)).toContain('"Authorization": "Bearer abc"');
  });
});

describe("converters", () => {
  it("guesses timestamp units", () => {
    expect(guessTimestampUnit("1700000000")).toBe("s");
    expect(guessTimestampUnit("1700000000000")).toBe("ms");
    expect(guessTimestampUnit("1700000000000000")).toBe("us");
    expect(timestampToDate("1700000000", "s")?.toISOString()).toBe("2023-11-14T22:13:20.000Z");
    expect(timestampToDate("abc", "s")).toBeNull();
  });
  it("converts number bases exactly with BigInt", () => {
    const n = parseBigInt("0xFFFFFFFFFFFFFFFF", 16);
    expect(n.ok && n.value.toString()).toBe("18446744073709551615");
    expect(n.ok && toBase(n.value, 2)).toBe("1".repeat(64));
    expect(parseBigInt("102", 2).ok).toBe(false);
    expect(groupDigits("11111111", 4)).toBe("1111 1111");
    expect(groupDigits("1234567", 3, ",")).toBe("1,234,567");
  });
  it("converts file sizes in SI and binary units", () => {
    const sizes = convertSize(1, "GiB");
    expect(sizes.find((s) => s.id === "MB")!.value).toBe(1073.741824);
    expect(sizes.find((s) => s.id === "MiB")!.value).toBe(1024);
  });
  it("parses RFC 4180 CSV and converts both ways", () => {
    expect(parseCsv('a,b\n"x, y","he said ""hi"""\n"multi\nline",2')).toEqual([["a", "b"], ["x, y", 'he said "hi"'], ["multi\nline", "2"]]);
    expect(csvToJson("name;age;ok\nAsha;30;true")).toEqual({ ok: true, value: [{ name: "Asha", age: 30, ok: true }] });
    expect(csvToJson("id\n007", { types: true })).toEqual({ ok: true, value: [{ id: "007" }] });
    expect(jsonToCsv([{ name: "A, B", address: { city: "Pune" }, tags: [1, 2] }, { name: "C" }])).toEqual({
      ok: true, value: 'name,address.city,tags\r\n"A, B",Pune,"[1,2]"\r\nC,,',
    });
  });
  it("converts colors", () => {
    expect(parseHex("#0af")).toEqual({ r: 0, g: 170, b: 255, a: 1 });
    expect(toHex({ r: 0, g: 170, b: 255, a: 0.5 })).toBe("#00aaff80");
    expect(formatRgb(parseColor("rgb(255 0 0 / 50%)")!)).toBe("rgba(255, 0, 0, 0.5)");
    expect(toHex(hslToRgb({ h: 210, s: 100, l: 50, a: 1 }))).toBe("#0080ff");
    expect(formatHsl(rgbToHsl({ r: 255, g: 0, b: 0, a: 1 }))).toBe("hsl(0, 100%, 50%)");
    expect(parseColor("#12")).toBeNull();
  });
  it("computes WCAG contrast", () => {
    expect(contrastRatio(parseHex("#000")!, parseHex("#fff")!)).toBeCloseTo(21, 5);
    expect(contrastRatio(parseHex("#777")!, parseHex("#fff")!)).toBeCloseTo(4.48, 2);
  });
});

describe("web helpers", () => {
  it("diffs lines and words", () => {
    expect(diffLines("a\nb\nc", "a\nB\nc\nd").map((op) => `${op.type[0]}${op.text}`)).toEqual(["sa", "rb", "aB", "sc", "ad"]);
    expect(diffLines("a\nb", "a\nB", { ignoreCase: true }).every((op) => op.type === "same")).toBe(true);
    expect(diffWords("the red car", "the blue car").filter((op) => op.type !== "same").map((op) => op.text)).toEqual(["red", "blue"]);
  });
  it("classifies IP addresses", () => {
    expect(inspectIp("192.168.1.1")).toMatchObject({ version: 4, kind: "Private (RFC 1918)", isPublic: false, integer: "3232235777" });
    expect(inspectIp("8.8.8.8")).toMatchObject({ isPublic: true, binary: "00001000.00001000.00001000.00001000" });
    expect(inspectIp("2001:0db8:0000:0000:0000:0000:0000:0001")).toMatchObject({ version: 6, normalized: "2001:db8::1", kind: "Documentation" });
    expect(inspectIp("::ffff:192.0.2.1")).toMatchObject({ normalized: "::ffff:c000:201", kind: "IPv4-mapped" });
    expect(inspectIp("2606:4700::1111")).toMatchObject({ isPublic: true });
    expect(inspectIp("256.1.1.1")).toBeNull();
    expect(inspectIp("1:2:3")).toBeNull();
  });
  it("parses user agents", () => {
    const chrome = parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
    expect(chrome).toMatchObject({ browser: { name: "Chrome", version: "126.0.0.0" }, os: { name: "Windows", version: "10 / 11" }, device: "Desktop", engine: { name: "Blink" } });
    const iphone = parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1");
    expect(iphone).toMatchObject({ browser: { name: "Safari", version: "17.5" }, os: { name: "iOS", version: "17.5" }, device: "Mobile" });
    const edge = parseUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87");
    expect(edge.browser.name).toBe("Microsoft Edge");
    expect(parseUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)").device).toBe("Bot");
  });
  it("checks email addresses", () => {
    expect(checkEmail("user@example.com")).toMatchObject({ valid: true });
    expect(checkEmail("user@gmial.com")).toMatchObject({ valid: true, suggestion: "user@gmail.com" });
    expect(checkEmail("user@@x.com").valid).toBe(false);
    expect(checkEmail("a..b@x.com")).toMatchObject({ valid: false, reason: "Two dots in a row." });
    expect(checkEmail("user@localhost")).toMatchObject({ valid: false });
  });
  it("ships regex presets that match their own samples", () => {
    for (const preset of REGEX_PRESETS) expect(new RegExp(preset.pattern, preset.flags).test(preset.sample), preset.id).toBe(true);
  });
});

describe("programming cases", () => {
  it("splits camel, acronym and separated identifiers", () => {
    expect(splitIdentifier("parseHTTPResponse_v2")).toEqual(["parse", "http", "response", "v2"]);
    expect(splitIdentifier("  user-ID first.name ")).toEqual(["user", "id", "first", "name"]);
  });
  it("converts between cases", () => {
    expect(toCodeCase("Hello world again", "camel")).toBe("helloWorldAgain");
    expect(toCodeCase("hello_world", "pascal")).toBe("HelloWorld");
    expect(toCodeCase("XMLHttpRequest", "snake")).toBe("xml_http_request");
    expect(toCodeCase("maxRetryCount", "constant")).toBe("MAX_RETRY_COUNT");
    expect(toCodeCase("Max Retry Count", "kebab")).toBe("max-retry-count");
    expect(toCodeCase("app config", "dot")).toBe("app.config");
    expect(toCodeCase("", "camel")).toBe("");
  });
});
