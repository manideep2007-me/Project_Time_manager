import { API_BASE_URL } from './config';

/**
 * Turn API-returned upload URLs into a URI the device can load.
 * - API may return http://localhost:... or http://127.0.0.1:... which fail on Android emulator.
 * - Relative paths like /uploads/... need the API origin prepended.
 */
export function resolveUploadUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const base = API_BASE_URL.replace(/\/$/, '');

  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const baseParsed = new URL(base);
    const badHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
    const h = parsed.hostname.toLowerCase();
    if (badHosts.has(h)) {
      return `${baseParsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    // Server echoed Android-emulator host (10.0.2.2) but app uses LAN IP or vice versa
    if (h === '10.0.2.2' && baseParsed.hostname !== '10.0.2.2') {
      return `${baseParsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (baseParsed.hostname === '10.0.2.2' && h !== '10.0.2.2' && badHosts.has(h)) {
      return `${baseParsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return trimmed;
  } catch {
    const lower = trimmed.toLowerCase();
    const idx = lower.indexOf('uploads');
    if (idx !== -1) {
      const rel = trimmed.substring(idx).replace(/\\/g, '/');
      return `${base}/${rel}`;
    }
  }

  return trimmed;
}
