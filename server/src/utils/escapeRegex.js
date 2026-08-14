/**
 * Escapes characters that have special meaning in a regular expression,
 * so a string can be safely interpolated into `new RegExp(...)` or a
 * Mongo $regex query without being interpreted as a regex pattern.
 *
 * Without this, user input like ".*" or "(a+)+" is treated as regex
 * syntax instead of literal text — causing false matches (ReDoS-unsafe
 * patterns) and, in the worst case, catastrophic backtracking that
 * can hang the Node process (Regular Expression Denial of Service).
 */
export function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
