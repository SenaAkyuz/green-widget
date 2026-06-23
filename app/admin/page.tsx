import { getDashboard } from "@/lib/analytics";
import { money, num } from "@/lib/format";
import { rangeToFrom, rangeLabel, DEFAULT_RANGE } from "@/lib/range";
import { AdminHeader } from "./AdminHeader";

export const dynamic = "force-dynamic";

const SECTOR_COLORS: Record<string, string> = {
  mobility: "#2d7a3a",
  delivery: "#4caf50",
  dining: "#f5a623",
  ecommerce: "#8bc34a",
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const includeDemo = sp.demo !== "0";
  const range = sp.range || DEFAULT_RANGE;
  const { kpis, monthly_trend, revenue_by_merchant } = await getDashboard({
    includeDemo,
    from: rangeToFrom(range),
  });
  const maxRevenue = Math.max(...monthly_trend.map((m) => m.revenue), 1);
  const totalByMerchant = Math.max(
    revenue_by_merchant.reduce((s, m) => s + m.revenue, 0),
    1
  );

  const cards = [
    { label: "Toplam Merchant", value: num(kpis.total_merchants), icon: "🏢" },
    { label: "Aktif Entegrasyon", value: num(kpis.active_integrations), icon: "🔌" },
    { label: "Bu Ay Katkı Geliri", value: money(kpis.month_revenue_try), icon: "💰" },
    { label: "Toplam İşlem", value: num(kpis.total_transactions), icon: "💳" },
    { label: "Yönetilen CO₂", value: `${num(kpis.total_carbon_tons)} ton`, icon: "🌍" },
    { label: "Kabul Oranı", value: `%${kpis.acceptance_rate}`, icon: "✅" },
  ];

  return (
    <div className="p-8">
      <AdminHeader
        title="Genel Bakış"
        description={`Tüm partnerler · ${rangeLabel(range)} · TRY karşılığı`}
        range={range}
        exportRows={revenue_by_merchant}
        exportName="genel-bakis.csv"
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-text mb-4">Aylık Gelir Trendi (TRY)</h2>
          <div className="flex items-end gap-3 h-48">
            {monthly_trend.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col justify-end h-40">
                  <div
                    className="w-full bg-gradient-to-t from-[#2d7a3a] to-[#8bc34a] rounded-t-md transition-all"
                    style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                    title={money(m.revenue)}
                  />
                </div>
                <span className="text-[10px] text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by merchant */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-text mb-4">
            Merchant Bazlı Gelir Dağılımı
          </h2>
          <div className="space-y-3">
            {revenue_by_merchant.map((m) => (
              <div key={m.merchant_id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-text">{m.name}</span>
                  <span className="text-muted">{money(m.revenue)}</span>
                </div>
                <div className="h-2 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(m.revenue / totalByMerchant) * 100}%`,
                      background: SECTOR_COLORS[m.sector] ?? "#2d7a3a",
                    }}
                  />
                </div>
              </div>
            ))}
            {revenue_by_merchant.length === 0 && (
              <p className="text-sm text-muted py-6 text-center">
                Bu aralıkta veri yok.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
