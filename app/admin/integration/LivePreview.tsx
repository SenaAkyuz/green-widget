"use client";

import { useEffect, useRef } from "react";

// Gerçek gg-widget.js'i (v1) mock checkout içine inject eder — ÖNERİLEN data-amount
// modunda: tutar script'e verilir, widget katkıyı ekleyip yeni toplamı host'un
// "Toplam" satırına (data-target) yazar. amount/currency/type değişince yeniden
// enjekte edilir. Endpoint yok → veri yazmaz.
export function LivePreview({
  amount,
  currency,
  type,
}: {
  amount: number;
  currency: string;
  type: string;
}) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const mount = document.getElementById("gg-live-mount");
    if (mount) mount.innerHTML = "";
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }
    const s = document.createElement("script");
    s.src = "/v1/gg-widget.js";
    s.async = false;
    s.setAttribute("data-merchant-id", "PREVIEW");
    s.setAttribute("data-amount", String(amount));
    s.setAttribute("data-currency", currency);
    s.setAttribute("data-type", type);
    s.setAttribute("data-locale", "tr");
    s.setAttribute("data-percent", "1.5");
    s.setAttribute("data-mount", "#gg-live-mount");
    s.setAttribute("data-target", "#gg-live-total");
    document.body.appendChild(s);
    scriptRef.current = s;
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [amount, currency, type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-text">Canlı Önizleme</h2>
        <span className="text-[10px] uppercase tracking-wide bg-primary-soft text-primary px-2 py-0.5 rounded-full font-semibold">
          gerçek widget
        </span>
      </div>
      <div className="bg-bg rounded-xl p-4 border border-border">
        <div className="text-xs font-semibold text-muted mb-2">
          Sepetim · Demo Store
        </div>
        <div className="flex justify-between text-sm text-text">
          <span>Ara Toplam</span>
          <span className="font-semibold">{money2(amount, currency)}</span>
        </div>
        {/* Widget kartı buraya basılır */}
        <div id="gg-live-mount" />
        <div className="flex justify-between text-sm font-bold text-text mt-2 pt-2 border-t border-border">
          <span>Toplam</span>
          {/* Widget yeni toplamı (tutar + katkı) buraya yazar */}
          <span id="gg-live-total">{money2(amount, currency)}</span>
        </div>
      </div>
    </div>
  );
}

// Widget'ın 2 ondalıklı formatına yakın gösterim.
function money2(n: number, currency: string) {
  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : "TL";
  const f = n.toLocaleString(currency === "TRY" ? "tr-TR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "TRY" ? `${f} ${sym}` : `${sym}${f}`;
}
