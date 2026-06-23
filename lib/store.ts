// Green Gold Connect — data layer.
// Uses Supabase when NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
// set, otherwise falls back to an in-memory store seeded with demo data so the
// MVP runs with zero credentials. All functions are async (Supabase path).

import { estimateCarbon } from "./carbon";
import { supabaseConfigured, sbSelect, sbInsert, sbUpdate } from "./supabase";

export interface Merchant {
  id: string;
  merchant_id: string;
  name: string;
  sector: string;
  website: string | null;
  city: string | null;
  country: string | null;
  status: "active" | "test" | "paused";
  default_percentage: number | null;
  default_fixed: number | null;
  currency: string;
  contact_email: string | null;
  // Widget'ın çalıştırılmasına izin verilen origin host'ları (boş = ayarlanmadı).
  allowed_domains: string[];
  is_demo: boolean;
  created_at: string;
}

export interface Payout {
  id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  merchant_id: string;
  session_id: string;
  original_amount: number;
  contribution_amount: number;
  currency: string;
  carbon_kg: number;
  contribution_selected: boolean;
  payment_status: string;
  stripe_session_id: string | null;
  type: string;
  metadata: Record<string, unknown>;
  is_demo: boolean;
  created_at: string;
}

export const usingSupabase = supabaseConfigured;

export interface TxFilter {
  merchant_id?: string;
  payment_status?: string;
  currency?: string;
  from?: string;
  to?: string;
  limit?: number;
  // When false, only real (is_demo=false) rows are returned. Default: include all.
  includeDemo?: boolean;
}

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return "id_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

// ---------------------------------------------------------------------------
// Supabase-backed implementation
// ---------------------------------------------------------------------------
function txQuery(f: TxFilter): string {
  const parts: string[] = ["select=*", "order=created_at.desc"];
  if (f.merchant_id) parts.push(`merchant_id=eq.${encodeURIComponent(f.merchant_id)}`);
  if (f.payment_status) parts.push(`payment_status=eq.${encodeURIComponent(f.payment_status)}`);
  if (f.currency) parts.push(`currency=eq.${encodeURIComponent(f.currency)}`);
  if (f.from) parts.push(`created_at=gte.${encodeURIComponent(f.from)}`);
  if (f.to) parts.push(`created_at=lte.${encodeURIComponent(f.to)}`);
  if (f.includeDemo === false) parts.push("is_demo=eq.false");
  if (f.limit) parts.push(`limit=${f.limit}`);
  return parts.join("&");
}

// ---------------------------------------------------------------------------
// In-memory fallback (seeded)
// ---------------------------------------------------------------------------
type DB = { merchants: Merchant[]; transactions: Transaction[]; payouts: Payout[] };
const g = globalThis as unknown as { __ggDB?: DB };

const SEED_MERCHANTS: Omit<Merchant, "id" | "created_at">[] = [
  { merchant_id: "BITAKSI001", name: "BiTaksi", sector: "mobility", website: "bitaksi.com", city: "İstanbul", country: "TR", status: "active", default_percentage: 1.5, default_fixed: 6.5, currency: "TRY", contact_email: "partners@bitaksi.com", allowed_domains: ["bitaksi.com", "www.bitaksi.com"], is_demo: true },
  { merchant_id: "YEMEKSEP001", name: "Yemeksepeti", sector: "delivery", website: "yemeksepeti.com", city: "İstanbul", country: "TR", status: "active", default_percentage: 1.5, default_fixed: null, currency: "TRY", contact_email: "sustainability@yemeksepeti.com", allowed_domains: ["yemeksepeti.com"], is_demo: true },
  { merchant_id: "CIPRIANI001", name: "Cipriani Dubai", sector: "dining", website: "cipriani.com", city: "Dubai", country: "AE", status: "active", default_percentage: 1.5, default_fixed: null, currency: "EUR", contact_email: "crown@cipriani.com", allowed_domains: ["cipriani.com"], is_demo: true },
  { merchant_id: "TRENDYOL001", name: "Trendyol", sector: "ecommerce", website: "trendyol.com", city: "İstanbul", country: "TR", status: "test", default_percentage: 1.0, default_fixed: null, currency: "TRY", contact_email: "green@trendyol.com", allowed_domains: ["trendyol.com"], is_demo: true },
];

const SECTOR_BASE: Record<string, number> = {
  mobility: 268.5,
  delivery: 320,
  dining: 540,
  ecommerce: 480,
};

function seed(): DB {
  const now = Date.now();
  const merchants: Merchant[] = SEED_MERCHANTS.map((m, i) => ({
    ...m,
    id: uid(),
    created_at: new Date(now - (120 - i * 10) * 864e5).toISOString(),
  }));
  const transactions: Transaction[] = [];
  for (const m of merchants) {
    const count = m.sector === "mobility" ? 90 : m.sector === "delivery" ? 70 : 40;
    const base = SECTOR_BASE[m.sector] ?? 300;
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const ts = now - daysAgo * 864e5 - Math.floor(Math.random() * 864e5);
      const amount = Math.round(base * (0.5 + Math.random() * 1.6) * 100) / 100;
      const selected = Math.random() < 0.76;
      const pct = m.default_percentage ?? 1.5;
      const minB = m.currency === "TRY" ? 3 : 1;
      const maxB = m.currency === "TRY" ? 500 : 100;
      const contribution = selected
        ? Math.round(Math.min(Math.max((amount * pct) / 100, minB), maxB) * 100) / 100
        : 0;
      transactions.push({
        id: uid(),
        merchant_id: m.merchant_id,
        session_id: uid(),
        original_amount: amount,
        contribution_amount: contribution,
        currency: m.currency,
        carbon_kg: estimateCarbon(m.sector, amount),
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
  transactions.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return { merchants, transactions, payouts: [] };
}

function mem(): DB {
  if (!g.__ggDB) g.__ggDB = seed();
  return g.__ggDB;
}

function memFilter(rows: Transaction[], f: TxFilter): Transaction[] {
  let out = rows;
  if (f.merchant_id) out = out.filter((t) => t.merchant_id === f.merchant_id);
  if (f.payment_status) out = out.filter((t) => t.payment_status === f.payment_status);
  if (f.currency) out = out.filter((t) => t.currency === f.currency);
  if (f.from) out = out.filter((t) => t.created_at >= f.from!);
  if (f.to) out = out.filter((t) => t.created_at <= f.to!);
  if (f.includeDemo === false) out = out.filter((t) => !t.is_demo);
  if (f.limit) out = out.slice(0, f.limit);
  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function listMerchants(includeDemo = true): Promise<Merchant[]> {
  if (usingSupabase) {
    const q = includeDemo
      ? "select=*&order=created_at.asc"
      : "select=*&is_demo=eq.false&order=created_at.asc";
    return sbSelect<Merchant>("merchants", q);
  }
  const rows = mem().merchants;
  return includeDemo ? rows : rows.filter((m) => !m.is_demo);
}

export async function getMerchant(
  idOrMerchantId: string
): Promise<Merchant | undefined> {
  if (usingSupabase) {
    const key = encodeURIComponent(idOrMerchantId);
    // id uuid kolonu → non-uuid değeri id.eq.'e koymak Postgres hatası verir.
    // Sadece uuid biçiminde id'yi de sorgula; aksi halde merchant_id ile ara.
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrMerchantId
      );
    const filter = isUuid
      ? `or=(merchant_id.eq.${key},id.eq.${key})`
      : `merchant_id=eq.${key}`;
    const rows = await sbSelect<Merchant>(
      "merchants",
      `select=*&${filter}&limit=1`
    );
    return rows[0];
  }
  return mem().merchants.find(
    (m) => m.merchant_id === idOrMerchantId || m.id === idOrMerchantId
  );
}

export async function listTransactions(f: TxFilter = {}): Promise<Transaction[]> {
  if (usingSupabase) {
    return sbSelect<Transaction>("transactions", txQuery(f));
  }
  return memFilter(mem().transactions, f);
}

export async function insertTransaction(
  input: Partial<Transaction> & { merchant_id: string; original_amount: number }
): Promise<Transaction> {
  const type = input.type || "mobility";
  const row: Omit<Transaction, "id" | "created_at"> = {
    merchant_id: input.merchant_id,
    session_id: input.session_id || uid(),
    original_amount: Number(input.original_amount) || 0,
    contribution_amount: Number(input.contribution_amount) || 0,
    currency: input.currency || "TRY",
    carbon_kg:
      input.carbon_kg ??
      estimateCarbon(type, Number(input.original_amount) || 0, input.metadata),
    contribution_selected: Boolean(input.contribution_selected),
    payment_status: input.payment_status || "pending",
    stripe_session_id: input.stripe_session_id ?? null,
    type,
    metadata: input.metadata || {},
    // Live transactions (widget/demo page) are real by default.
    is_demo: Boolean(input.is_demo),
  };

  if (usingSupabase) {
    return sbInsert<Transaction>("transactions", row);
  }

  const tx: Transaction = { ...row, id: uid(), created_at: new Date().toISOString() };
  const rows = mem().transactions;
  const idx = rows.findIndex((t) => t.session_id === tx.session_id);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...tx, id: rows[idx].id };
    return rows[idx];
  }
  rows.unshift(tx);
  return tx;
}

// ---------------------------------------------------------------------------
// Merchants — create
// ---------------------------------------------------------------------------
export async function insertMerchant(input: {
  name: string;
  sector: string;
  city?: string;
  currency?: string;
  default_fixed?: number | null;
  default_percentage?: number | null;
  allowed_domains?: string[];
}): Promise<Merchant> {
  const sector = input.sector || "ecommerce";
  // Auto merchant_id: ŞİRKET-ADI-PREFIX + (mevcut max suffix + 1).
  // Prefix firma adından türetilir (BiTaksi→BITAKSI001, Yemeksepeti→YEMEKSEP001)
  // — seed verisiyle aynı stil. Aksanlar sadeleştirilir, alfanümerik olmayan
  // karakterler atılır, 8 karaktere kırpılır. Ad boşsa sektör/GGC fallback.
  // Suffix sayma değil max bazlı → silme sonrası çakışmaz (BITAKSI001 silinse de
  // BITAKSI002 varsa sıradaki BITAKSI003 olur).
  const slug = input.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // birleşik aksan işaretlerini at (Ç→C)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // boşluk/sembol at
  const prefix = (slug || sector.toUpperCase() || "GGC").slice(0, 8);
  const existing = await listMerchants();
  const re = new RegExp(`^${prefix}(\\d+)$`);
  const maxSuffix = existing.reduce((max, m) => {
    const match = m.merchant_id.match(re);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const merchant_id = `${prefix}${String(maxSuffix + 1).padStart(3, "0")}`;

  const row: Omit<Merchant, "id" | "created_at"> = {
    merchant_id,
    name: input.name,
    sector,
    website: null,
    city: input.city || null,
    country: null,
    status: "active",
    default_percentage: input.default_percentage ?? null,
    default_fixed: input.default_fixed ?? null,
    currency: input.currency || "TRY",
    contact_email: null,
    allowed_domains: input.allowed_domains ?? [],
    is_demo: false,
  };

  if (usingSupabase) {
    return sbInsert<Merchant>("merchants", row);
  }
  const m: Merchant = { ...row, id: uid(), created_at: new Date().toISOString() };
  mem().merchants.push(m);
  return m;
}

// merchant'ın izinli domain listesini günceller (origin doğrulama için).
export async function updateMerchantDomains(
  merchant_id: string,
  allowed_domains: string[]
): Promise<Merchant | undefined> {
  if (usingSupabase) {
    return sbUpdate<Merchant>(
      "merchants",
      `merchant_id=eq.${encodeURIComponent(merchant_id)}`,
      { allowed_domains }
    );
  }
  const m = mem().merchants.find((x) => x.merchant_id === merchant_id);
  if (m) m.allowed_domains = allowed_domains;
  return m;
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------
export async function listPayouts(): Promise<Payout[]> {
  if (usingSupabase) {
    return sbSelect<Payout>("payouts", "select=*&order=created_at.desc");
  }
  return mem().payouts;
}

export async function insertPayout(input: {
  merchant_id: string;
  amount: number;
  currency: string;
  period_start?: string | null;
  period_end?: string | null;
  status?: string;
  paid_at?: string | null;
}): Promise<Payout> {
  const row: Omit<Payout, "id" | "created_at"> = {
    merchant_id: input.merchant_id,
    amount: Math.round((Number(input.amount) || 0) * 100) / 100,
    currency: input.currency || "TRY",
    period_start: input.period_start ?? null,
    period_end: input.period_end ?? null,
    status: input.status || "paid",
    paid_at: input.paid_at ?? null,
  };
  if (usingSupabase) {
    return sbInsert<Payout>("payouts", row);
  }
  const p: Payout = { ...row, id: uid(), created_at: new Date().toISOString() };
  mem().payouts.unshift(p);
  return p;
}
