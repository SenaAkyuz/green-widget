// Widget'ın servis edildiği taban URL — partner snippet'lerinde kullanılır.
// Tek kaynak: hiçbir yerde domaini elle yazma.
//
// Çözüm sırası (otomatik → doğru URL):
//  1. NEXT_PUBLIC_SITE_URL env set ise → kanonik o kullanılır (örn. custom domain).
//  2. Aksi halde sayfa hangi origin'de açıldıysa o (integration: window.location,
//     server sayfalar: istek Host header'ı) → bugün greengold-widget.vercel.app,
//     yarın connect.greengold.eco bağlanınca OTOMATİK o.
//  3. Statik/SSR fallback → aşağıdaki production default.
//
// Bu modül client'ta da import edilir; next/headers gibi server-only şeyleri
// BURAYA koyma (server host türetimi sayfanın kendisinde headers() ile yapılır).

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://greengold-widget.vercel.app"
).replace(/\/+$/, "");

// env ile kanonik URL sabitlenmiş mi? (sabitse runtime origin'i ezme)
export const SITE_URL_PINNED = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

export function widgetSrc(base: string = SITE_URL): string {
  return `${base.replace(/\/+$/, "")}/v1/gg-widget.js`;
}
