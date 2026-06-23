// Origin doğrulama + basit rate limit — widget API'sini sahte/abuse POST'lardan korur.
// MVP: in-memory (tek süreç). Production'da rate limit için Upstash/Redis kullan.

import { NextRequest } from "next/server";

// İstek Origin (yoksa Referer) header'ından host'u çıkar. Boş → "".
export function originHost(req: NextRequest): string {
  const raw = req.headers.get("origin") || req.headers.get("referer") || "";
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isLocalHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

// host, allowed listesindeki bir domain'e (tam eşleşme veya alt-domain) uyuyor mu?
export function domainAllowed(host: string, allowed: string[]): boolean {
  if (!host || !allowed?.length) return false;
  return allowed.some((d) => {
    const dom = String(d)
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!dom) return false;
    return host === dom || host.endsWith("." + dom);
  });
}

// "a.com, www.a.com" gibi virgülle ayrılmış girdiyi temiz text[] dizisine çevirir.
export function parseDomains(csv: string): string[] {
  return Array.from(
    new Set(
      String(csv || "")
        .split(/[,\n]/)
        .map((d) =>
          d
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/.*$/, "")
        )
        .filter(Boolean)
    )
  );
}

// --- Rate limit: IP başına kayan 60 sn pencerede `limit` istek ---
const RL_LIMIT = 60;
const RL_WINDOW_MS = 60_000;
const store = (globalThis as unknown as { __ggRL?: Map<string, number[]> });
if (!store.__ggRL) store.__ggRL = new Map();

export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const map = store.__ggRL!;
  const hits = (map.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  hits.push(now);
  map.set(ip, hits);
  return hits.length > RL_LIMIT;
}
