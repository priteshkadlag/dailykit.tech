import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const chunks = {
  "hindi-mangal-keyboard": "HUCYYWY4", "hindi-remington-keyboard": "5BK223F6", "marathi-keyboard": "Y55O56ZY",
  // bengali-keyboard (InScript) is derived from hindi-mangal-keyboard in lib/keyboard-data.ts.
  "bangla-jatiya-keyboard": "UT576FUJ", "gujarati-keyboard": "EPKNQZCG",
  "oriya-keyboard": "UFTZOHRH", "punjabi-raavi-keyboard": "WBBNON2M", "kannada-keyboard": "XLRWPWXE",
  "malayalam-keyboard": "DUCXHEYU", "tamil-99-keyboard": "KY3MA2LK", "telugu-keyboard": "KQOSYJAK",
  "telugu-sarala-keyboard": "Q5GGQLG6", "arabic-keyboard": "ZDG2TCFA", "armenian-phonetic-keyboard": "LIXCY3FD",
  "bangla-bijoy-keyboard": "EY2GQFP3", "bulgarian-keyboard": "OQHRK33H", "georgian-keyboard": "3RMV5ZYL",
  "greek-keyboard": "UDZMY3NA", "hebrew-keyboard": "T727G5VJ", "nepali-keyboard": "QHQO2USG",
  "pashto-keyboard": "TXAC5JKJ", "persian-keyboard": "EVJOXXIP", "russian-keyboard": "S7IKGK3D",
  "sinhala-keyboard": "RTT7SQDU", "thai-keyboard": "W3UVW2UC", "turkish-keyboard": "ATAMMXZN",
  "ukrainian-keyboard": "QN6JKD3H", "urdu-keyboard": "K6B2UF7U", "urdu-phonetic-v1-2-keyboard": "FH5SDS67",
  "urdu-phonetic-v1-1-keyboard": "DHQJURAZ",
};

const result = {};
for (const [slug, id] of Object.entries(chunks)) {
  const source = readFileSync(join(tmpdir(), `chunk-${id}.js`), "utf8");
  const match = source.match(/var\s+\w+=(\{.*\}),\w+=\w+;export/s);
  if (!match) throw new Error(`Could not parse ${id}`);
  const config = Function(`"use strict"; return (${match[1]})`)();
  result[slug] = config.keyLayout.map(({ i, n, s, t }) => ({ id: i, normal: n ?? "", ...(s ? { shift: s } : {}), ...(t ? { alt: t } : {}) }));
}
process.stdout.write(`// Generated from the public keyboard configuration data referenced by each layout.\nexport interface KeyboardKey { id: string; normal: string; shift?: string; alt?: string }\nexport const keyboardLayouts: Record<string, KeyboardKey[]> = ${JSON.stringify(result, null, 2)};\n`);
