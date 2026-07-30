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
    <div className="p-4 sm:p-6 lg:p-8 min-w-0">
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
            className="min-w-0 bg-surface border border-border rounded-2xl shadow-sm p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">{c.label}</span>
              <span className="text-lg shrink-0">{c.icon}</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-text truncate">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Pending payouts by merchant */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm mb-6">
        <div className="px-5 py-3 border-b border-border text-sm font-bold text-text">
          Bekleyen Ödemeler (işlem gelirinden hesaplanır)
        </div>

        {/* Mobil kart listesi — < md */}
        <div className="md:hidden divide-y divide-border">
          {rows.map((r) => (
            <div key={r.merchant_id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-text flex items-center gap-2 flex-wrap">
                    <span className="truncate">{r.name}</span>
                    {r.is_demo && (
                      <span className="shrink-0 text-[9px] uppercase tracking-wide bg-bg text-muted px-1.5 py-0.5 rounded">
                        demo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted font-mono mt-0.5">{r.merchant_id}</div>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div className="col-span-2">
                  <dt className="text-muted">Dönem</dt>
                  <dd className="text-text mt-0.5">
                    {r.period_start ? date(r.period_start) : "—"} –{" "}
                    {r.period_end ? date(r.period_end) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Toplam Gelir</dt>
                  <dd className="text-text mt-0.5">{money(r.revenue, r.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Ödenmiş</dt>
                  <dd className="text-text mt-0.5">{money(r.paid, r.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Bekleyen</dt>
                  <dd className="font-semibold text-primary mt-0.5">
                    {money(r.pending, r.currency)}
                  </dd>
                </div>
              </dl>
              {r.pending > 0 && (
                <div className="mt-3">
                  <MarkPaidButton
                    merchant_id={r.merchant_id}
                    amount={r.pending}
                    currency={r.currency}
                    period_start={r.period_start}
                    period_end={r.period_end}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Masaüstü tablo — md+ */}
        <div className="hidden md:block overflow-x-auto">
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
      </div>

      {/* Payout history */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm">
        <div className="px-5 py-3 border-b border-border text-sm font-bold text-text">
          Ödeme Geçmişi
        </div>

        {/* Mobil kart listesi — < md */}
        <div className="md:hidden divide-y divide-border">
          {payouts.map((p) => (
            <div key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-text truncate min-w-0">{p.merchant_id}</span>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary">
                  {p.status}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-muted">Tutar</dt>
                  <dd className="text-text mt-0.5">{money(p.amount, p.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Ödeme Tarihi</dt>
                  <dd className="text-text mt-0.5">{p.paid_at ? date(p.paid_at) : "—"}</dd>
                </div>
              </dl>
            </div>
          ))}
          {payouts.length === 0 && (
            <p className="px-5 py-8 text-center text-muted text-sm">
              Henüz ödeme yapılmadı. Yukarıdan &quot;Ödendi işaretle&quot; ile kaydet.
            </p>
          )}
        </div>

        {/* Masaüstü tablo — md+ */}
        <div className="hidden md:block overflow-x-auto">
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
    </div>
  );
}
