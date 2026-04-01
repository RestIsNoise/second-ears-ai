/**
 * Sanitize a filename for safe storage.
 * Keeps letters, numbers, dots, and hyphens only.
 * Spaces become hyphens; all other characters are stripped.
 */
export function sanitizeFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";

  const clean = stem
    .replace(/\s+/g, "-")          // spaces → hyphens
    .replace(/[^a-zA-Z0-9.\-]/g, "") // strip everything else
    .replace(/-{2,}/g, "-")        // collapse consecutive hyphens
    .replace(/^-+|-+$/g, "");      // trim leading/trailing hyphens

  return (clean || "file") + ext.toLowerCase();
}
