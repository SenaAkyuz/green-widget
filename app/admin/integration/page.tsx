"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "../AdminHeader";
import { LivePreview } from "./LivePreview";
import { DEFAULT_RANGE } from "@/lib/range";
import { SITE_URL, SITE_URL_PINNED, widgetSrc } from "@/lib/site";

const MERCHANT_ID = "MERCHANT001";

function snippets(amount: number, currency: string, type: string, base: string) {
  return {
    Web: `<!-- checkout/ödeme sayfanızın </body>'sinden hemen önce -->
<script async src="${widgetSrc(base)}"
  data-merchant-id="${MERCHANT_ID}"
  data-amount="${amount}"
  data-currency="${currency}"
  data-type="${type}" data-locale="tr"></script>`,
    React: `<GreenGoldWidget
  merchantId="${MERCHANT_ID}"
  amount={${amount}}
  currency="${currency}"
  type="${type}"
/>`,
    "iOS (Swift)": `GreenGold.shared.present(
  merchantId: "${MERCHANT_ID}",
  amount: ${amount},
  currency: "${currency}"
)`,
    Android: `GreenGold.show(this, "${MERCHANT_ID}", ${amount}.0, "${currency}", "${type}")`,
    "REST API": `POST ${base}/api/calculate
Content-Type: application/json

{
  "merchant_id": "${MERCHANT_ID}",
  "amount": ${amount},
  "currency": "${currency}",
  "type": "${type}"
}`,
  } as Record<string, string>;
}

const ONBOARDING = [
  {
    n: 1,
    t: "Hesabını aç",
    d: "Partner panelinden merchant_id al. Kurulum ücreti yok, komisyon işlem başına.",
  },
  {
    n: 2,
    t: "Tek satırı yapıştır",
    d: "Sitenin checkout sayfasına ya da app'ine tek script/SDK satırı ekle. 2 dakika.",
  },
  {
    n: 3,
    t: "Ödemeyi al",
    d: "Widget katkıyı sepete ekler, ödemeyi alır. Kazanç otomatik panoya düşer.",
  },
];

export default function IntegrationPage() {
  const [amount, setAmount] = useState(850);
  const [currency, setCurrency] = useState("TRY");
  const [type, setType] = useState("ecommerce");
  const [platform, setPlatform] = useState("Web");
  const [copied, setCopied] = useState(false);

  // Snippet URL'i otomatik: env ile sabitlenmemişse panelin açık olduğu origin'i
  // kullan (canlıda greengold-widget.vercel.app, custom domain bağlanınca o).
  const [base, setBase] = useState(SITE_URL);
  useEffect(() => {
    if (!SITE_URL_PINNED && typeof window !== "undefined") {
      setBase(window.location.origin);
    }
  }, []);

  // Simülatör
  const [trips, setTrips] = useState(100000);
  const [accept, setAccept] = useState(75);
  const [avg, setAvg] = useState(6);

  const sim = useMemo(() => {
    const daily = trips * (accept / 100) * avg;
    const dailyCarbon = trips * (accept / 100) * 4.5; // ~4.5 kg/işlem ort.
    return {
      daily: Math.round(daily),
      monthly: Math.round(daily * 30),
      yearly: Math.round(daily * 365),
      carbon: Math.round((dailyCarbon * 365) / 1000), // ton/yıl
    };
  }, [trips, accept, avg]);

  const allSnippets = snippets(amount, currency, type, base);
  const platforms = Object.keys(allSnippets);
  const code = allSnippets[platform];

  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const fmt = (n: number) => n.toLocaleString("tr-TR");

  return (
    <div className="p-8">
      <AdminHeader
        title="Entegrasyon"
        description="3 adımda kurulum · platform seç, kodu kopyala, yayına al"
        range={DEFAULT_RANGE}
      />

      {/* Onboarding */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {ONBOARDING.map((s) => (
          <div
            key={s.n}
            className="bg-surface border border-border rounded-2xl shadow-sm p-5 flex gap-3"
          >
            <span className="w-8 h-8 shrink-0 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
              {s.n}
            </span>
            <div>
              <div className="font-semibold text-sm text-text">{s.t}</div>
              <div className="text-xs text-muted mt-0.5">{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Config controls */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end">
        <Field label="Tutar">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="w-28 bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Para birimi">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm"
          >
            <option value="TRY">TRY</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </Field>
        <Field label="Dikey (type)">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm"
          >
            <option value="mobility">mobility</option>
            <option value="delivery">delivery</option>
            <option value="ecommerce">ecommerce</option>
            <option value="hotel">hotel</option>
            <option value="dining">dining</option>
          </select>
        </Field>
        <p className="text-xs text-muted flex-1 min-w-[200px]">
          Snippet ve önizleme bu değerlerle canlı güncellenir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code panel */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-wrap gap-1 p-2 border-b border-border">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  platform === p
                    ? "bg-primary text-white"
                    : "text-muted hover:text-text hover:bg-bg"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              onClick={copy}
              className="absolute top-3 right-3 text-xs font-semibold bg-primary-soft text-primary hover:bg-[#dcefdf] px-3 py-1.5 rounded-lg"
            >
              {copied ? "✓ Kopyalandı" : "Kopyala"}
            </button>
            <pre className="p-5 pt-12 text-xs sm:text-[13px] text-[#1a3a22] bg-[#f6faf6] overflow-x-auto font-mono leading-relaxed">
              {code}
            </pre>
          </div>
          {platform === "Web" && (
            <p className="px-5 py-3 text-xs text-muted border-t border-border bg-primary-soft/40">
              💡 <code className="text-primary font-semibold">data-amount</code>'ı
              checkout toplamınızla dinamik basın (örn. şablon değişkeni{" "}
              <code className="text-primary font-semibold">{`data-amount="{{cart_total}}"`}</code>).
              Sabit değer yalnızca sabit fiyatlı sayfalar içindir. İleri: tutarı
              basamıyorsanız{" "}
              <code className="text-primary font-semibold">{`data-target="#cart-total"`}</code>{" "}
              ile widget toplamı DOM'dan otomatik okur.
            </p>
          )}
          <p className="px-5 py-3 text-xs text-muted border-t border-border">
            Widget; dikeyi (delivery/ride/ecommerce/hotel), dili (TR/EN) ve komisyon
            oranını otomatik uygular. <b className="text-text">embed</b> modunda host
            sitenin toplamına eklenir, <b className="text-text">redirect</b> modunda
            ödemeyi doğrudan Green Gold alır.
          </p>
        </div>

        {/* Live preview */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
          <LivePreview amount={amount} currency={currency} type={type} />
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Test Modu Aktif — Stripe & Supabase bağlı
            </span>
          </div>
        </div>
      </div>

      {/* Earnings simulator */}
      <div className="mt-6 bg-surface border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-text">💰 Kazanç Simülatörü</h2>
          <span className="text-xs text-muted">kendi rakamlarını dene</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <SimField label="Günlük işlem sayısı" value={trips} setValue={setTrips} step={5000} />
          <SimField label="Ortalama katkı (TL)" value={avg} setValue={setAvg} step={1} />
          <SimField label="Kabul oranı (%)" value={accept} setValue={setAccept} step={5} max={100} />
        </div>
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: "Günlük gelir", v: `${fmt(sim.daily)} TL` },
            { l: "Aylık gelir", v: `${fmt(sim.monthly)} TL` },
            { l: "Yıllık gelir", v: `${fmt(sim.yearly)} TL` },
            { l: "Yönetilen CO₂ (yıl)", v: `${fmt(sim.carbon)} ton` },
          ].map((x) => (
            <div key={x.l} className="bg-bg rounded-xl p-4 text-center border border-border">
              <div className="text-xs text-muted">{x.l}</div>
              <div className="text-lg font-extrabold text-primary mt-1">{x.v}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-3">
          Benchmark: benzer ürünlerde %70–85 kabul oranı görülür.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted block mb-1">{label}</span>
      {children}
    </label>
  );
}

function SimField({
  label,
  value,
  setValue,
  step,
  max,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  step: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        max={max}
        min={0}
        onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
        className="mt-1 w-full bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );
}
