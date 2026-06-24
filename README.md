# 🌿 Green Gold Connect — MVP

Tek satır JavaScript ile herhangi bir checkout sayfasına eklenen **karbon nötrlük katkı widget'ı** + BiTaksi demo sayfası + admin dashboard. BiTaksi CEO görüşmesi için çalışan demo.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
```

Kimlik bilgisi gerekmez — uygulama, demo verisiyle seed edilmiş **bellek-içi store** ile çalışır. Supabase bağlamak için `.env.example` → `.env.local`.

## Sayfalar

| Yol | Açıklama |
|-----|----------|
| `/` | Landing — ürün anlatımı + entegrasyon snippet'i |
| `/demo` | **BiTaksi ödeme ekranı simülasyonu** — gerçek `gg-widget.js` embed edilmiş |
| `/admin` | Genel Bakış (KPI + grafikler) — açık tema |
| `/admin/partners` | Merchant listesi + gelir özeti (isimler detaya linkli) |
| `/admin/partners/[id]` | Partner detay — snippet + kurulum notu + `allowed_domains` düzenleme + son işlemler |
| `/admin/transactions` | İşlemler tablosu + filtreler |
| `/admin/payouts` | Kazanç — merchant'a ödenecek/ödenen, "Ödendi işaretle" |
| `/admin/integration` | Kurulum kodu (Web/React/iOS/Android/REST) + canlı önizleme + simülatör |

### Dashboard özellikleri
- **Açık tema** (token'lar `app/globals.css`: `--bg/--surface/--border/--primary/--primary-soft/--gold/--text/--muted`).
- **Header (her sayfa):** tarih aralığı dropdown (`?range=7d|30d|3m|6m|all`, default 6m → KPI/grafik/tablo `created_at` süzer), **Dışa Aktar** (client CSV), **+ Widget Ekle** (modal → `merchants` insert, server action, otomatik merchant_id, `allowed_domains`, `is_demo=false`).
- **Partner detay** (`/admin/partners/[id]`): KPI'lar + entegrasyon snippet'i (kurulum notuyla) + `allowed_domains` düzenleme + son işlemler. Partner listesinde isimler buraya linklenir.
- **Kazanç:** payout bekleyen tutarlar işlem gelirinden hesaplanır; "Ödendi işaretle" `payouts`'a paid kaydı yazar (FK: merchant_id → merchants).
- **Canlı önizleme:** gerçek `v1/gg-widget.js` mock checkout'a inject edilir; tutar/para birimi/dikey değişince güncellenir.

## Widget

`public/v1/gg-widget.js` — bağımlılıksız vanilla JS, **versiyonlu yol** (`/v1/`).
Kırıcı değişiklikler `/v2/` altında yayınlanır; `/v1/` sabit kalır, partner siteleri bozulmaz.
Önerilen partner entegrasyonu:

```html
<!-- checkout/ödeme sayfanızın </body>'sinden hemen önce -->
<script
  async
  src="https://greengold-widget.vercel.app/v1/gg-widget.js"
  data-merchant-id="MERCHANT001"
  data-amount="850"
  data-currency="TRY"
  data-type="ecommerce"
  data-locale="tr">
</script>
```

> **URL otomatik.** Admin → Entegrasyon ve Partner detay sayfalarındaki snippet, panelin açıldığı origin'i kullanır (bugün `greengold-widget.vercel.app`, custom domain bağlanınca otomatik o). Kanonik bir domaini zorlamak için `NEXT_PUBLIC_SITE_URL` set et (örn. `https://connect.greengold.eco`). Tek kaynak: `lib/site.ts`.

> **Önerilen:** `data-amount`'ı checkout toplamınızla **dinamik** basın (örn. şablon değişkeni `data-amount="{{cart_total}}"`). Sabit değer yalnızca sabit fiyatlı sayfalar içindir.
>
> **Alternatif (ileri):** tutarı dinamik basamıyorsanız `data-target="#cart-total"` verin — widget toplamı DOM'dan okur ve değişince (kupon/adet) `MutationObserver` ile katkıyı yeniden hesaplar. `data-amount` verilmişse o önceliklidir.
>
> **Fail-silent:** widget herhangi bir hata verirse (network/parse/DOM) sessizce hiçbir şey render etmez ve host checkout'unu **kilitlemez** (no-op `window.GreenGold` API'si init patlasa bile çağrılabilir kalır).
>
> `merchant_id` partner adından otomatik üretilir (BiTaksi → `BITAKSI001`).

`window.GreenGold.confirm()` — host sitenin "Onayla" butonu çağırır; katkıyı `data-endpoint`'e POST eder.

### Güvenlik (origin doğrulama + rate limit)

- Her merchant'ın `allowed_domains` (text[]) listesi vardır — widget'ın işlem yazabileceği origin host'ları. Admin → Partner detay sayfasından (veya "Widget Ekle" modalından) düzenlenir.
- `POST /api/transactions` isteğin `Origin`/`Referer` host'unu `allowed_domains` ile karşılaştırır:
  - Eşleşmezse → **403**, kayıt yapılmaz.
  - `allowed_domains` boşsa (henüz ayarlanmamış) → istek **`is_demo=true`** olarak kabul edilir (gerçek geliri kirletmez).
  - `localhost`/`127.0.0.1` her zaman kabul (yerel test / CEO demo).
- **Rate limit:** IP başına dakikada 60 istek üstü → **429** (in-memory, MVP). Production'da Upstash/Redis'e taşı (`lib/guard.ts`).

## API

- `POST /api/calculate` — karbon + katkı hesaplar
- `POST /api/transactions` — widget payload'ını kaydeder (`crypto.randomUUID` session_id), `GET` ile filtreli listeler
- `GET /api/merchants`, `GET /api/merchants/[id]`, `GET /api/dashboard`

## Demo verisi (is_demo bayrağı)

Demo verisi gerçek veriden `is_demo boolean` ile ayrılır. Gerçek (canlı) işlemler `is_demo=false`, seed verisi `is_demo=true`.

1. **Migration (tek seferlik, SQL gerektirir):** `supabase/migrations/`'daki dosyaları sırayla Supabase Dashboard → SQL Editor'da çalıştır — `0001_add_is_demo.sql` (is_demo bayrağı) ve `0002_add_allowed_domains.sql` (origin doğrulama için `allowed_domains`).
2. **Seed:** `npm run seed` (sadece eksik merchant'lar) · `npm run seed -- --tx` (+ ~240 demo işlem).
3. **Dashboard toggle:** Sidebar'da "Demo verisini göster" (default açık). Kapatınca yalnızca gerçek işlemler görünür → CEO'ya dolu göster, sonra kapat, canlı yolculuğu onayla, dashboard'da anında belirsin.
4. **Reset:** `npm run reset` — sadece `is_demo=true` satırları siler, gerçek veriye dokunmaz.

> BiTaksi gerçek merchant olarak zaten kayıtlı (`is_demo=false`). Seed onu atlar; demo BiTaksi *işlemleri* `is_demo=true` olur, böylece toggle kapanınca gerçek BiTaksi satırı altında sahte işlem görünmez.

## Notlar

- **MVP/demo** — bellek-içi store tek süreçte kalıcıdır (local demo için yeterli). Production için `SUPABASE_*` set edilince Postgres'e geçer.
- Hesaplama mantığı `lib/carbon.ts`'te; widget ile birebir aynı öncelik (fixed → percent → sektör default).
