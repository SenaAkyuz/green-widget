import Link from "next/link";
import { getMerchantsWithTotals } from "@/lib/analytics";
import { money, num, date } from "@/lib/format";
import { rangeToFrom, rangeLabel, DEFAULT_RANGE } from "@/lib/range";
import { AdminHeader } from "../AdminHeader";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Aktif", cls: "bg-primary-soft text-primary" },
  test: { label: "Test", cls: "bg-[#fdf0d8] text-[#a9700f]" },
  paused: { label: "Duraklatıldı", cls: "bg-bg text-muted" },
};

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const includeDemo = sp.demo !== "0";
  const range = sp.range || DEFAULT_RANGE;
  const merchants = await getMerchantsWithTotals({
    includeDemo,
    from: rangeToFrom(range),
  });

  const exportRows = merchants.map((m) => ({
    merchant_id: m.merchant_id,
    name: m.name,
    sector: m.sector,
    city: m.city,
    status: m.status,
    currency: m.currency,
    transaction_count: m.transaction_count,
    total_revenue: m.total_revenue,
    is_demo: m.is_demo,
  }));

  return (
    <div className="p-8">
      <AdminHeader
        title="Partnerler"
        description={`${merchants.length} merchant · ${rangeLabel(range)}`}
        range={range}
        exportRows={exportRows}
        exportName="partnerler.csv"
      />

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-5 py-3 font-medium">Sektör</th>
              <th className="px-5 py-3 font-medium">Şehir</th>
              <th className="px-5 py-3 font-medium">Durum</th>
              <th className="px-5 py-3 font-medium">Oran</th>
              <th className="px-5 py-3 font-medium text-right">İşlem</th>
              <th className="px-5 py-3 font-medium text-right">Gelir</th>
              <th className="px-5 py-3 font-medium">Son İşlem</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => {
              const st = STATUS[m.status] ?? STATUS.test;
              return (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-bg"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/partners/${m.merchant_id}`}
                      className="font-semibold text-text hover:text-primary flex items-center gap-2"
                    >
                      {m.name}
                      {m.is_demo && (
                        <span className="text-[9px] uppercase tracking-wide bg-bg text-muted px-1.5 py-0.5 rounded">
                          demo
                        </span>
                      )}
                    </Link>
                    <div className="text-[11px] text-muted font-mono">{m.merchant_id}</div>
                  </td>
                  <td className="px-5 py-3 capitalize text-muted">{m.sector}</td>
                  <td className="px-5 py-3 text-muted">{m.city ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {m.default_fixed != null
                      ? `${m.default_fixed} ${m.currency}`
                      : m.default_percentage != null
                      ? `%${m.default_percentage}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-text">{num(m.transaction_count)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-primary">
                    {money(m.total_revenue, m.currency)}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {m.last_transaction_at ? date(m.last_transaction_at) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
