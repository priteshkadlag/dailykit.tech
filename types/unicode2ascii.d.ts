declare module "unicode2ascii" {
  /** Unicode Bangla → Bijoy (SutonnyMJ) ASCII. */
  export function ConvertToASCII(font: "bijoy", text: string): string;
  /** Bijoy (SutonnyMJ) ASCII → Unicode Bangla. */
  export function ConvertToUnicode(font: "bijoy", text: string): string;
}
