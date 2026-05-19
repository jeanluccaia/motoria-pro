// Strips any character outside printable ASCII (0x20–0x7E) from header values.
// HTTP headers must be ISO-8859-1 safe; anything outside 0x00–0xFF throws a
// TypeError in Window.fetch(). Limiting to 0x20–0x7E (printable ASCII) is the
// safest subset and covers all real-world token/key formats.

export function sanitizeHeaderValue(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

export function buildSafeHeaders(headersObject) {
  const safe = {};
  for (const [key, value] of Object.entries(headersObject || {})) {
    const cleanKey   = sanitizeHeaderValue(key);
    const cleanValue = sanitizeHeaderValue(value);
    if (cleanKey && cleanValue !== undefined) {
      safe[cleanKey] = cleanValue;
    }
  }
  if (import.meta.env.DEV) {
    console.log("[safeHeaders] built headers:", JSON.stringify(safe));
  }
  return safe;
}

// Reads a localStorage key, strips non-ASCII, and writes back the clean value.
// Returns the cleaned string (empty string if nothing stored).
export function cleanLocalStorageToken(storageKey) {
  try {
    const raw   = localStorage.getItem(storageKey);
    if (!raw) return "";
    const clean = sanitizeHeaderValue(raw);
    if (clean !== raw) {
      if (clean) {
        localStorage.setItem(storageKey, clean);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
    return clean;
  } catch {
    return "";
  }
}
