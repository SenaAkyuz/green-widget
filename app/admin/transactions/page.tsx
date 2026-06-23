import { listMerchants, listTransactions } from "@/lib/store";
import { money, dateTime } from "@/lib/format";
import { rangeToFrom, rangeLabel, DEFAULT_RANGE } from "@/lib/range";
import { AdminHeader } from "../AdminHeader";

export const dynamic = "force-dynamic";

const STATUS_CLS: Record<string, string> = {
  completed: "bg-primary-soft text-primary",
  pending: "bg-[#fdf0d8] text-[#a9700f]",
  failed: "bg-red-100 text-red-600",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const includeDemo = sp.demo !== "0";
  const range = sp.range || DEFAULT_RANGE;
  const merchants = await listMerchants(); // dropdown: tüm merchant'lar
  const rows = await listTransactions({
    merchant_id: sp.merchant_id || undefined,
    payment_status: sp.payment_status || undefined,
    currency: sp.currency || undefined,
    from: rangeToFrom(range),
    includeDemo,
    limit: 200,
  });

  const exportRows = rows.map((t) => ({
    created_at: t.created_at,
    merchant_id: t.merchant_id,
    session_id: t.session_id,
    original_amount: t.original_amount,
    contribution_amount: t.contribution_amount,
    currency: t.currency,
    carbon_kg: t.carbon_kg,
    contribution_selected: t.contribution_selected,
    payment_status: t.payment_status,
    is_demo: t.is_demo,
  }));

  return (
    <div className="p-8">
      <AdminHeader
        title="İşlemler"
        description={`${rows.length} işlem · ${rangeLabel(range)}`}
        range={range}
        exportRows={exportRows}
        exportName="islemler.csv"
      />

      {/* Filters */}
      <form className="flex flex-wrap gap-3 text-sm mb-6" method="get">
        {!includeDemo && <input type="hidden" name="demo" value="0" />}
        <input type="hidden" name="range" value={range} />
        <select
          name="merchant_id"
          defaultValue={sp.merchant_id || ""}
          className="bg-surface border border-border text-text rounded-lg px-3 py-2"
        >
          <option value="">Tüm merchantlar</option>
          {merchants.map((m) => (
            <option key={m.merchant_id} value={m.merchant_id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          name="payment_status"
          defaultValue={sp.payment_status || ""}
          className="bg-surface border border-border text-text rounded-lg px-3 py-2"
        >
          <option value="">Tüm durumlar</option>
          <option value="completed">Tamamlandı</option>
          <option value="pending">Beklemede</option>
          <option value="failed">Başarısız</option>
        </select>
        <select
          name="currency"
          defaultValue={sp.currency || ""}
          className="bg-surface border border-border text-text rounded-lg px-3 py-2"
        >
          <option value="">Tüm para birimleri</option>
          <option value="TRY">TRY</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
        <button
          type="submit"
          className="bg-primary hover:bg-[#256530] text-white px-4 py-2 rounded-lg font-semibold"
        >
          Filtrele
        </button>
        <a
          href={`/admin/transactions?range=${range}${includeDemo ? "" : "&demo=0"}`}
          className="px-4 py-2 rounded-lg text-muted hover:text-text"
        >
          Temizle
        </a>
      </form>

      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="px-5 py-3 font-medium">Tarih</th>
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-5 py-3 font-medium">Session</th>
              <th className="px-5 py-3 font-medium text-right">Tutar</th>
              <th className="px-5 py-3 font-medium text-right">Katkı</th>
              <th className="px-5 py-3 font-medium text-right">CO₂</th>
              <th className="px-5 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg">
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {dateTime(t.created_at)}
                </td>
                <td className="px-5 py-3 font-medium text-text">
                  <span className="inline-flex items-center gap-2">
                    {t.merchant_id}
                    {t.is_demo && (
                      <span className="text-[9px] uppercase tracking-wide bg-bg text-muted px-1.5 py-0.5 rounded">
                        demo
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3 text-[11px] font-mono text-muted">
                  {t.session_id.slice(0, 8)}…
                </td>
                <td className="px-5 py-3 text-right text-text">
                  {money(t.original_amount, t.currency)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-primary">
                  {t.contribution_selected ? `+${money(t.contribution_amount, t.currency)}` : "—"}
                </td>
                <td className="px-5 py-3 text-right text-muted">{t.carbon_kg} kg</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      STATUS_CLS[t.payment_status] ?? "bg-bg text-muted"
                    }`}
                  >
                    {t.payment_status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">
                  Bu filtreyle eşleşen işlem yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
