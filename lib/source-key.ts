/**
 * One recipe links to another by web address, and the same page is written a
 * dozen ways: with and without "www.", with a trailing slash, with tracking
 * junk on the end. Reduce an address to the part that identifies the page, so
 * a link found in an ingredient list matches a recipe already on the shelf.
 */
export function sourceKeyOf(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsed.pathname.replace(/\/+$/, "");
  return host + (path || "");
}

/** Two addresses that point at the same page, whatever their spelling. */
export function sameSite(a: string, b: string) {
  try {
    const host = (u: string) => new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    return host(a) === host(b);
  } catch {
    return false;
  }
}
