// Supabase demo seed — partner merchants (+ optional demo transactions).
//   node --env-file=.env.local scripts/seed.mjs          # sadece merchant'lar
//   node --env-file=.env.local scripts/seed.mjs --tx     # + demo işlemler
//
// Güvenli: var olan merchant_id'leri atlar (mükerrer eklemez).

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yok.");
  process.exit(1);
}
const withTx = process.argv.includes("--tx");

const h = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, init) {
  const res = await fetch(`${URL}/rest/v1/${path}`, { ...init, headers: { ...h, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(`${res.status} ${path}: ${await res.text()}`);
  return res;
}

// Hepsi is_demo:true. BiTaksi gerçek merchant olarak zaten var; seed onu atlar
// (var olan merchant_id'ler eklenmez), demo BiTaksi *işlemleri* is_demo:true ile
// kaydedilir ve dashboard toggle'ı kapatılınca gizlenir.
const MERCHANTS = [
  { merchant_id: "BITAKSI001", name: "BiTaksi", sector: "mobility", website: "bitaksi.com", city: "İstanbul", country: "TR", status: "active", default_percentage: 1.5, default_fixed: 6.5, currency: "TRY", contact_email: "partners@bitaksi.com", allowed_domains: ["bitaksi.com", "www.bitaksi.com"], is_demo: true },
  { merchant_id: "YEMEKSEP001", name: "Yemeksepeti", sector: "delivery", website: "yemeksepeti.com", city: "İstanbul", country: "TR", status: "active", default_percentage: 1.5, default_fixed: null, currency: "TRY", contact_email: "sustainability@yemeksepeti.com", allowed_domains: ["yemeksepeti.com"], is_demo: true },
  { merchant_id: "CIPRIANI001", name: "Cipriani Dubai", sector: "dining", website: "cipriani.com", city: "Dubai", country: "AE", status: "active", default_percentage: 1.5, default_fixed: null, currency: "EUR", contact_email: "crown@cipriani.com", allowed_domains: ["cipriani.com"], is_demo: true },
  { merchant_id: "TRENDYOL001", name: "Trendyol", sector: "ecommerce", website: "trendyol.com", city: "İstanbul", country: "TR", status: "test", default_percentage: 1.0, default_fixed: null, currency: "TRY", contact_email: "green@trendyol.com", allowed_domains: ["trendyol.com"], is_demo: true },
];

// /demo simülasyon sayfasının yazdığı ayrı merchant — GERÇEK BiTaksi'yi (BITAKSI001)
// kirletmemek için. Sadece merchant olarak eklenir, otomatik işlem üretilmez
// (canlı onaylar buraya is_demo=true düşer).
const DEMO_MERCHANTS = [
  { merchant_id: "BITAKSIDEMO", name: "BiTaksi (Demo)", sector: "mobility", website: "bitaksi.com", city: "İstanbul", country: "TR", status: "active", default_percentage: 1.5, default_fixed: 6.5, currency: "TRY", contact_email: "demo@greengold.eco", allowed_domains: ["localhost", "127.0.0.1"], is_demo: true },
];

const FACTOR = { mobility: 0.21, delivery: 0.15, ecommerce: 0.5, hotel: 20, dining: 0.8 };
const BASE = { mobility: 268.5, delivery: 320, dining: 540, ecommerce: 480 };

function carbon(type, amount) {
  if (type === "mobility") return Math.round((amount / 12) * FACTOR.mobility * 100) / 100;
  if (type === "dining") return Math.round(Math.max(1, Math.round(amount / 250)) * FACTOR.dining * 100) / 100;
  return Math.round((FACTOR[type] ?? 0.2) * 100) / 100;
}

async function main() {
  // 1) Merchants — sadece eksik olanları ekle.
  const existing = await (await rest("merchants?select=merchant_id")).json();
  const have = new Set(existing.map((m) => m.merchant_id));
  const missing = [...MERCHANTS, ...DEMO_MERCHANTS].filter((m) => !have.has(m.merchant_id));
  if (missing.length) {
    await rest("merchants", { method: "POST", body: JSON.stringify(missing) });
    console.log(`✓ ${missing.length} merchant eklendi: ${missing.map((m) => m.merchant_id).join(", ")}`);
  } else {
    console.log("• Tüm merchant'lar zaten var, atlandı.");
  }

  if (!withTx) {
    console.log("Bitti. (İşlem seed'i için: --tx)");
    return;
  }

  // 2) Demo transactions (son 90 gün, ~%76 kabul).
  const now = Date.now();
  const rows = [];
  for (const m of MERCHANTS) {
    const count = m.sector === "mobility" ? 90 : m.sector === "delivery" ? 70 : 40;
    const base = BASE[m.sector] ?? 300;
    for (let i = 0; i < count; i++) {
      const ts = now - Math.floor(Math.random() * 90) * 864e5 - Math.floor(Math.random() * 864e5);
      const amount = Math.round(base * (0.5 + Math.random() * 1.6) * 100) / 100;
      const selected = Math.random() < 0.76;
      const minB = m.currency === "TRY" ? 3 : 1;
      const maxB = m.currency === "TRY" ? 500 : 100;
      const contribution = selected
        ? Math.round(Math.min(Math.max((amount * (m.default_percentage ?? 1.5)) / 100, minB), maxB) * 100) / 100
        : 0;
      rows.push({
        merchant_id: m.merchant_id,
        session_id: crypto.randomUUID(),
        original_amount: amount,
        contribution_amount: contribution,
        currency: m.currency,
        carbon_kg: carbon(m.sector, amount),
        contribution_selected: selected,
        payment_status: "completed",
        stripe_session_id: null,
        type: m.sector,
        metadata: { seeded: true },
        is_demo: true,
        created_at: new Date(ts).toISOString(),
      });
    }
  }
  // 200'lük partiler halinde gönder.
  for (let i = 0; i < rows.length; i += 200) {
    await rest("transactions", { method: "POST", body: JSON.stringify(rows.slice(i, i + 200)) });
  }
  console.log(`✓ ${rows.length} demo işlem eklendi.`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
