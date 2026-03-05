/**
 * SSRF protection: allow only HTTPS URLs from allowlisted domains,
 * and block private IPs / localhost.
 */
const ALLOWED_HOST_SUFFIXES = [".runware.ai", "runware.ai"];

function isPrivateOrLocalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;
  if (lower === "0.0.0.0") return true;
  // IPv4
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c] = ipv4Match.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
    return false;
  }
  // IPv6 loopback / link-local
  if (lower === "[::1]" || lower === "::1") return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fd") || lower.startsWith("fc")) return true;
  return false;
}

function isHostAllowlisted(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => lower === suffix || (suffix.startsWith(".") && lower.endsWith(suffix))
  );
}

export function isUrlAllowedForFetch(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isPrivateOrLocalHost(hostname)) return false;
  if (!isHostAllowlisted(hostname)) return false;
  return true;
}
