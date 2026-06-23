import {
  listMerchants,
  listTransactions,
  listPayouts,
  type Transaction,
} from "./store";

// TRY-equivalent FX for a single headline revenue number (demo rates).
const FX: Record<string, number> = { TRY: 1, EUR: 36, USD: 33 };
const toTRY = (amt: number, cur: string) => amt * (FX[cur] ?? 1);

export interface AnalyticsOpts {
  includeDemo?: boolean;
  from?: string;
}

export async function getDashboard({ includeDemo = true, from }: AnalyticsOpts = {}) {
  const [merchants, tx] = await Promise.all([
    listMerchants(includeDemo),
    listTransactions({ includeDemo, from }),
  ]);
  const accepted = tx.filter((t) => t.contribution_selected);

  const totalRevenue = tx.reduce(
    (s, t) => s + toTRY(t.contribution_amount, t.currency),
    0
  );
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const monthRevenue = tx
    .filter((t) => t.created_at >= monthAgo)
    .reduce((s, t) => s + toTRY(t.contribution_amount, t.currency), 0);
  const totalCarbon = accepted.reduce((s, t) => s + t.carbon_kg, 0);

  const months: { label: string; revenue: number; transactions: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const inMonth = tx.filter(
      (t) => t.created_at >= d.toISOString() && t.created_at < next.toISOString()
    );
    months.push({
      label: d.toLocaleString("tr-TR", { month: "short" }),
      revenue: Math.round(
        inMonth.reduce((s, t) => s + toTRY(t.contribution_amount, t.currency), 0)
      ),
      transactions: inMonth.length,
    });
  }

  const byMerchant = merchants
    .map((m) => {
      const mtx = tx.filter((t) => t.merchant_id === m.merchant_id);
      return {
        merchant_id: m.merchant_id,
        name: m.name,
        sector: m.sector,
        revenue: Math.round(
          mtx.reduce((s, t) => s + toTRY(t.contribution_amount, t.currency), 0)
        ),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    kpis: {
      total_merchants: merchants.length,
      active_integrations: merchants.filter((m) => m.status === "active").length,
      month_revenue_try: Math.round(monthRevenue),
      total_revenue_try: Math.round(totalRevenue),
      total_transactions: tx.length,
      total_carbon_kg: Math.round(totalCarbon),
      total_carbon_tons: Math.round((totalCarbon / 1000) * 10) / 10,
      acceptance_rate: tx.length
        ? Math.round((accepted.length / tx.length) * 100)
        : 0,
    },
    monthly_trend: months,
    revenue_by_merchant: byMerchant,
  };
}

export async function getMerchantsWithTotals({
  includeDemo = true,
  from,
}: AnalyticsOpts = {}) {
  const [merchants, tx] = await Promise.all([
    listMerchants(includeDemo),
    listTransactions({ includeDemo, from }),
  ]);
  const byMerchant = new Map<string, Transaction[]>();
  for (const t of tx) {
    const arr = byMerchant.get(t.merchant_id) ?? [];
    arr.push(t);
    byMerchant.set(t.merchant_id, arr);
  }
  return merchants.map((m) => {
    const mtx = byMerchant.get(m.merchant_id) ?? [];
    return {
      ...m,
      transaction_count: mtx.length,
      total_revenue:
        Math.round(mtx.reduce((s, t) => s + t.contribution_amount, 0) * 100) / 100,
      last_transaction_at: mtx[0]?.created_at ?? null,
    };
  });
}

// Payouts: pending = toplam katkı geliri − o merchant'a ödenmiş payout'lar.
export async function getPayoutsData({ includeDemo = true }: AnalyticsOpts = {}) {
  const [merchants, tx, payouts] = await Promise.all([
    listMerchants(includeDemo),
    listTransactions({ includeDemo }),
    listPayouts(),
  ]);

  const paidByMerchant = new Map<string, number>();
  for (const p of payouts) {
    if (p.status === "paid") {
      paidByMerchant.set(
        p.merchant_id,
        (paidByMerchant.get(p.merchant_id) ?? 0) + p.amount
      );
    }
  }

  const rows = merchants.map((m) => {
    const mtx = tx.filter(
      (t) => t.merchant_id === m.merchant_id && t.contribution_selected
    );
    const revenue =
      Math.round(mtx.reduce((s, t) => s + t.contribution_amount, 0) * 100) / 100;
    const paid = Math.round((paidByMerchant.get(m.merchant_id) ?? 0) * 100) / 100;
    const pending = Math.round((revenue - paid) * 100) / 100;
    const dates = mtx.map((t) => t.created_at).sort();
    return {
      merchant_id: m.merchant_id,
      name: m.name,
      currency: m.currency,
      revenue,
      paid,
      pending: pending > 0 ? pending : 0,
      period_start: dates[0] ?? null,
      period_end: dates[dates.length - 1] ?? null,
      is_demo: m.is_demo,
    };
  });

  const toTRYsum = (arr: { pending?: number; paid?: number; currency: string }[], k: "pending" | "paid") =>
    Math.round(arr.reduce((s, r) => s + toTRY(r[k] ?? 0, r.currency), 0));

  return {
    rows,
    payouts,
    kpis: {
      total_pending_try: toTRYsum(rows, "pending"),
      total_paid_try: toTRYsum(rows, "paid"),
      period_revenue_try: Math.round(
        rows.reduce((s, r) => s + toTRY(r.revenue, r.currency), 0)
      ),
    },
  };
}
