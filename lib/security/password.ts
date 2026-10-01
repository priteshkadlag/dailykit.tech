export const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~",
} as const;
export type CharsetKey = keyof typeof CHARSETS;

/** Characters that are easy to confuse when reading or typing a password. */
export const AMBIGUOUS = "Il1O0o";

export interface PasswordOptions {
  length: number;
  sets: Record<CharsetKey, boolean>;
  excludeAmbiguous: boolean;
}

export const MIN_LENGTH = 4;
export const MAX_LENGTH = 128;

type RandomSource = (array: Uint32Array) => Uint32Array;
const cryptoRandom: RandomSource = (array) => crypto.getRandomValues(array);

/**
 * Uniform random integer in [0, max) from a CSPRNG, using rejection sampling to avoid the
 * modulo bias that `random % max` would introduce.
 */
export function secureRandomInt(max: number, random: RandomSource = cryptoRandom) {
  if (max <= 0 || max > 2 ** 32) throw new RangeError("max out of range");
  const limit = 2 ** 32 - (2 ** 32 % max);
  const buf = new Uint32Array(1);
  let value: number;
  do {
    value = random(buf)[0];
  } while (value >= limit);
  return value % max;
}

function charsetsFor({ sets, excludeAmbiguous }: PasswordOptions) {
  return (Object.keys(CHARSETS) as CharsetKey[])
    .filter((key) => sets[key])
    .map((key) => (excludeAmbiguous ? [...CHARSETS[key]].filter((c) => !AMBIGUOUS.includes(c)).join("") : CHARSETS[key]));
}

/**
 * Generates a password with the Web Crypto CSPRNG. Guarantees at least one character from every
 * selected set, then shuffles (Fisher–Yates) so those guaranteed characters aren't at fixed positions.
 * Nothing is stored or sent anywhere.
 */
export function generatePassword(options: PasswordOptions, random: RandomSource = cryptoRandom): string {
  const sets = charsetsFor(options);
  if (sets.length === 0) throw new Error("Select at least one character type.");
  const length = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.floor(options.length), sets.length));
  const pool = sets.join("");

  const chars = sets.map((set) => set[secureRandomInt(set.length, random)]);
  while (chars.length < length) chars.push(pool[secureRandomInt(pool.length, random)]);

  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1, random);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export type Strength = "weak" | "medium" | "strong";

/** Entropy in bits for a password made uniformly at random from the selected character pool. */
export function passwordEntropy(options: PasswordOptions) {
  const pool = charsetsFor(options).join("").length;
  return pool > 0 ? options.length * Math.log2(pool) : 0;
}

/** < 45 bits weak, < 70 bits medium, otherwise strong. */
export function strengthOf(bits: number): Strength {
  if (bits < 45) return "weak";
  if (bits < 70) return "medium";
  return "strong";
}
