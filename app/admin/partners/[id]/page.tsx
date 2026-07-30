import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getMerchant, listTransactions } from "@/lib/store";
import { money, num, date } from "@/lib/format";
import { AdminHeader } from "../../AdminHeader";
import { DEFAULT_RANGE } from "@/lib/range";
import { SITE_URL, SITE_URL_PINNED, widgetSrc } from "@/lib/site";
import { DomainsEditor } from "./DomainsEditor";
import { SnippetBox } from "./SnippetBox";

export const dynamic = "force-dynamic";

// Snippet taban URL'i: env ile sabitlenmemişse panelin açıldığı Host'tan türet
// (canlıda greengold-widget.vercel.app, custom domain bağlanınca otomatik o).
async function resolveBase(): Promise<string> {
  if (SITE_URL_PINNED) return SITE_URL;
  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {}
  return SITE_URL;
}

function snippet(merchantId: string, currency: string, type: string, base: string) {
  return `<!-- checkout/ödeme sayfanızın </body> etiketinden hemen önce -->
<script async src="${widgetSrc(base)}"
  data-merchant-id="${merchantId}"
  data-amount="{{cart_total}}"
  data-currency="${currency}"
  data-type="${type}" data-locale="tr"></script>`;
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) notFound();

  const tx = await listTransactions({ merchant_id: merchant.merchant_id });
  const accepted = tx.filter((t) => t.contribution_selected);
  const revenue =
    Math.round(tx.reduce((s, t) => s + t.contribution_amount, 0) * 100) / 100;
  const acceptanceRate = tx.length
    ? Math.round((accepted.length / tx.length) * 100)
    : 0;
  const carbon =
    Math.round(accepted.reduce((s, t) => s + t.carbon_kg, 0) * 100) / 100;

  const base = await resolveBase();
  const code = snippet(merchant.merchant_id, merchant.currency, merchant.sector, base);

  const kpis = [
    { l: "Toplam gelir", v: money(revenue, merchant.currency) },
    { l: "İşlem", v: num(tx.length) },
    { l: "Kabul oranı", v: `%${acceptanceRate}` },
    { l: "Dengelenen CO₂", v: `${num(Math.round(carbon))} kg` },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-w-0">
      <AdminHeader
        title={merchant.name}
        description={`${merchant.merchant_id} · ${merchant.sector}${
          merchant.city ? ` · ${merchant.city}` : ""
        }`}
        range={DEFAULT_RANGE}
      />

      <Link
        href="/admin/partners"
        className="inline-block text-sm text-muted hover:text-text mb-4"
      >
        ← Partnerler
      </Link>

      {/* KPI'lar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div
            key={k.l}
            className="min-w-0 bg-surface border border-border rounded-2xl shadow-sm p-4"
          >
            <div className="text-xs text-muted">{k.l}</div>
            <div className="text-lg font-extrabold text-primary mt-1 truncate">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entegrasyon snippet'i + kurulum notu */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-text mb-3">Entegrasyon kodu</h2>
          <SnippetBox code={code} />
          <div className="mt-3 text-xs text-muted space-y-1">
            <p>
              <b className="text-text">1.</b> Bu kodu checkout/ödeme sayfanızın{" "}
              <code className="text-primary font-semibold">&lt;/body&gt;</code>{" "}
              etiketinden hemen önce yapıştırın.
            </p>
            <p>
              <b className="text-text">2.</b>{" "}
              <code className="text-primary font-semibold">data-amount</code> değerini
              sepet toplamınızla doldurun (örn. şablon değişkeni{" "}
              <code className="text-primary font-semibold">{`{{cart_total}}`}</code>).
              Test için <Link href="/demo" className="underline">/demo</Link>’ya bakın.
            </p>
            <p className="text-[11px]">
              İleri: tutarı dinamik basamıyorsanız{" "}
              <code className="font-semibold">data-target=&quot;#cart-total&quot;</code>{" "}
              ile widget toplamı DOM’dan otomatik okur.
            </p>
          </div>
        </div>

        {/* Güvenlik — izinli domainler */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-bold text-text mb-3">
            Güvenlik · İzinli domainler
          </h2>
          <DomainsEditor
            merchantId={merchant.merchant_id}
            initial={merchant.allowed_domains ?? []}
          />
        </div>
      </div>

      {/* Son işlemler */}
      <div className="mt-6 bg-surface border border-border rounded-2xl shadow-sm">
        <div className="px-5 py-3 text-sm font-bold text-text border-b border-border">
          Son işlemler
        </div>

        {/* Mobil kart listesi — < md */}
        <div className="md:hidden divide-y divide-border">
          {tx.slice(0, 10).map((t) => (
            <div key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-text text-sm">{date(t.created_at)}</span>
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {t.payment_status}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-muted">Tutar</dt>
                  <dd className="text-text mt-0.5">{money(t.original_amount, t.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Katkı</dt>
                  <dd className="font-semibold text-primary mt-0.5">
                    {t.contribution_selected ? money(t.contribution_amount, t.currency) : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
          {tx.length === 0 && (
            <p className="px-5 py-6 text-center text-muted text-sm">Henüz işlem yok.</p>
          )}
        </div>

        {/* Masaüstü tablo — md+ */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="px-5 py-3 font-medium">Tarih</th>
                <th className="px-5 py-3 font-medium text-right">Tutar</th>
                <th className="px-5 py-3 font-medium text-right">Katkı</th>
                <th className="px-5 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {tx.slice(0, 10).map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-muted">{date(t.created_at)}</td>
                  <td className="px-5 py-3 text-right text-text">
                    {money(t.original_amount, t.currency)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-primary">
                    {t.contribution_selected
                      ? money(t.contribution_amount, t.currency)
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-muted">{t.payment_status}</td>
                </tr>
              ))}
              {tx.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-muted">
                    Henüz işlem yok.
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
