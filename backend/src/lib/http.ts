import { logger } from './logger';

export interface HttpOptions {
  timeoutMs?: number;
  retries?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** Strip API keys out of a URL before logging it. */
function redact(url: string): string {
  return url.replace(/(apikey|api_key|key|apiKey|token)=[^&]+/gi, '$1=***');
}

/**
 * Resilient JSON fetch: bounded timeout, one retry on 5xx / network error,
 * key-redacted logging. Returns null on failure so callers degrade gracefully
 * instead of throwing — a dead data source must not crash an analysis.
 */
export async function httpJson<T = unknown>(url: string, opts: HttpOptions = {}): Promise<T | null> {
  const { timeoutMs = 12_000, retries = 1, method = 'GET', headers, body } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, body, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        logger.warn('http_non_ok', { url: redact(url), status: res.status });
        if (res.status >= 500 && attempt < retries) continue;
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      logger.warn('http_error', { url: redact(url), err: String(err) });
      if (attempt < retries) continue;
      return null;
    }
  }
  return null;
}
