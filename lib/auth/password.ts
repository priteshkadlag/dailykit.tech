import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

// A real hash of a random string, compared against when the account doesn't exist so a failed
// login takes the same time whether or not the email is registered.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(password: string, hash: string | null | undefined) {
  dummyHash ??= bcrypt.hash(crypto.randomUUID(), ROUNDS);
  const ok = await bcrypt.compare(password, hash ?? (await dummyHash));
  return ok && Boolean(hash);
}
