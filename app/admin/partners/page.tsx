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
    <div className="p-4 sm:p-6 lg:p-8 min-w-0">
      <AdminHeader
        title="Partnerler"
        description={`${merchants.length} merchant · ${rangeLabel(range)}`}
        range={range}
        exportRows={exportRows}
        exportName="partnerler.csv"
      />

      <div className="bg-surface border border-border rounded-2xl shadow-sm">
        {/* Mobil kart listesi — < md */}
        <div className="md:hidden divide-y divide-border">
          {merchants.map((m) => {
            const st = STATUS[m.status] ?? STATUS.test;
            const rate =
              m.default_fixed != null
                ? `${m.default_fixed} ${m.currency}`
                : m.default_percentage != null
                ? `%${m.default_percentage}`
                : "—";
            return (
              <Link
                key={m.id}
                href={`/admin/partners/${m.merchant_id}`}
                className="block min-h-11 p-4 hover:bg-bg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-text flex items-center gap-2 flex-wrap">
                      <span className="truncate">{m.name}</span>
                      {m.is_demo && (
                        <span className="shrink-0 text-[9px] uppercase tracking-wide bg-bg text-muted px-1.5 py-0.5 rounded">
                          demo
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted font-mono mt-0.5">{m.merchant_id}</div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-muted">Sektör</dt>
                    <dd className="text-text capitalize mt-0.5">{m.sector}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Şehir</dt>
                    <dd className="text-text mt-0.5">{m.city ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">İşlem</dt>
                    <dd className="text-text mt-0.5">{num(m.transaction_count)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Gelir</dt>
                    <dd className="font-semibold text-primary mt-0.5">
                      {money(m.total_revenue, m.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Oran</dt>
                    <dd className="text-text mt-0.5">{rate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Son işlem</dt>
                    <dd className="text-text mt-0.5">
                      {m.last_transaction_at ? date(m.last_transaction_at) : "—"}
                    </dd>
                  </div>
                </dl>
              </Link>
            );
          })}
          {merchants.length === 0 && (
            <p className="text-sm text-muted py-6 text-center">Bu aralıkta veri yok.</p>
          )}
        </div>

        {/* Masaüstü tablo — md+ */}
        <div className="hidden md:block overflow-x-auto">
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
    </div>
  );
}
