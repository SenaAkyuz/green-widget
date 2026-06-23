import { getPayoutsData } from "@/lib/analytics";
import { money, date } from "@/lib/format";
import { DEFAULT_RANGE } from "@/lib/range";
import { AdminHeader } from "../AdminHeader";
import { MarkPaidButton } from "./MarkPaidButton";

export const dynamic = "force-dynamic";

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const includeDemo = sp.demo !== "0";
  const range = sp.range || DEFAULT_RANGE;
  const { rows, payouts, kpis } = await getPayoutsData({ includeDemo });

  const exportRows = rows.map((r) => ({
    merchant_id: r.merchant_id,
    name: r.name,
    currency: r.currency,
    revenue: r.revenue,
    paid: r.paid,
    pending: r.pending,
    period_start: r.period_start,
    period_end: r.period_end,
  }));

  const cards = [
    { label: "Toplam Ödenecek", value: money(kpis.total_pending_try), icon: "⏳" },
    { label: "Bu Dönem Gelir", value: money(kpis.period_revenue_try), icon: "📈" },
    { label: "Ödenmiş Toplam", value: money(kpis.total_paid_try), icon: "✅" },
  ];

  return (
    <div className="p-8">
      <AdminHeader
        title="Kazanç"
        description="Merchant'lara ödenecek/ödenen katkı tutarları · TRY karşılığı"
        range={range}
        exportRows={exportRows}
        exportName="kazanc.csv"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-surface border border-border rounded-2xl shadow-sm p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{c.label}</span>
              <span className="text-lg">{c.icon}</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-text">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Pending payouts by merchant */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-x-auto mb-6">
        <div className="px-5 py-3 border-b border-border text-sm font-bold text-text">
          Bekleyen Ödemeler (işlem gelirinden hesaplanır)
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-5 py-3 font-medium">Dönem</th>
              <th className="px-5 py-3 font-medium text-right">Toplam Gelir</th>
              <th className="px-5 py-3 font-medium text-right">Ödenmiş</th>
              <th className="px-5 py-3 font-medium text-right">Bekleyen</th>
              <th className="px-5 py-3 font-medium text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.merchant_id}
                className="border-b border-border last:border-0 hover:bg-bg"
              >
                <td className="px-5 py-3 font-medium text-text">
                  <span className="inline-flex items-center gap-2">
                    {r.name}
                    {r.is_demo && (
                      <span className="text-[9px] uppercase tracking-wide bg-bg text-muted px-1.5 py-0.5 rounded">
                        demo
                      </span>
                    )}
                  </span>
                  <div className="text-[11px] text-muted font-mono">{r.merchant_id}</div>
                </td>
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {r.period_start ? date(r.period_start) : "—"} –{" "}
                  {r.period_end ? date(r.period_end) : "—"}
                </td>
                <td className="px-5 py-3 text-right text-text">
                  {money(r.revenue, r.currency)}
                </td>
                <td className="px-5 py-3 text-right text-muted">
                  {money(r.paid, r.currency)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-primary">
                  {money(r.pending, r.currency)}
                </td>
                <td className="px-5 py-3 text-right">
                  {r.pending > 0 ? (
                    <MarkPaidButton
                      merchant_id={r.merchant_id}
                      amount={r.pending}
                      currency={r.currency}
                      period_start={r.period_start}
                      period_end={r.period_end}
                    />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payout history */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-x-auto">
        <div className="px-5 py-3 border-b border-border text-sm font-bold text-text">
          Ödeme Geçmişi
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-5 py-3 font-medium text-right">Tutar</th>
              <th className="px-5 py-3 font-medium">Durum</th>
              <th className="px-5 py-3 font-medium">Ödeme Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-5 py-3 font-medium text-text">{p.merchant_id}</td>
                <td className="px-5 py-3 text-right text-text">
                  {money(p.amount, p.currency)}
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary">
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted">
                  {p.paid_at ? date(p.paid_at) : "—"}
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  Henüz ödeme yapılmadı. Yukarıdan "Ödendi işaretle" ile kaydet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
