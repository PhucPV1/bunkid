import { createHash, timingSafeEqual } from "node:crypto";

// Hashing first gives equal-length buffers, so timingSafeEqual never throws
// and the comparison time does not depend on where the strings differ.
export function secretsMatch(given: string | null, expected: string): boolean {
  if (given === null || expected === "") return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
