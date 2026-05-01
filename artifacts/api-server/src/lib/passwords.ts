import bcrypt from "bcryptjs";

// 10 rounds is the long-standing OWASP-suggested default for bcrypt — a
// reasonable balance between register/login latency (~50–100 ms on commodity
// hardware) and resistance to offline attack. If we ever move to Argon2 we
// can swap just this file.
const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
