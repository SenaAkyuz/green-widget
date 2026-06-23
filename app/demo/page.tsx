"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Augment window with the widget's global API.
declare global {
  interface Window {
    GreenGold?: {
      confirm: () => number;
      total: () => number;
      isSelected: () => boolean;
      contribution: () => number;
    };
  }
}

const TRIP = {
  from: "Maslak",
  to: "Kadıköy",
  km: 21.4,
  min: 34,
  fare: 268.5,
};

export default function DemoPage() {
  const injected = useRef(false);
  const [done, setDone] = useState<null | { paid: number; contribution: number }>(
    null
  );

  // Inject the real embeddable widget exactly like a partner would: one
  // <script> tag with data-* config. Done once (StrictMode-safe).
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    const s = document.createElement("script");
    s.src = "/v1/gg-widget.js";
    s.async = false;
    // Bu sayfa bir SİMÜLASYON. Gerçek BiTaksi merchant'ını (BITAKSI001)
    // kirletmemek için ayrı bir demo merchant'a ve ?demo=1 endpoint'ine yazar
    // → is_demo=true. Gerçek entegrasyon BITAKSI001 + /api/transactions kullanır.
    s.setAttribute("data-merchant-id", "BITAKSIDEMO");
    s.setAttribute("data-amount", String(TRIP.fare));
    s.setAttribute("data-currency", "TRY");
    s.setAttribute("data-type", "mobility");
    s.setAttribute("data-locale", "tr");
    s.setAttribute("data-fixed", "6.50");
    s.setAttribute("data-mount", "#gg-mount");
    s.setAttribute("data-target", "#trip-total-val");
    s.setAttribute("data-endpoint", "/api/transactions?demo=1");
    document.body.appendChild(s);
  }, []);

  function handleConfirm() {
    const gg = window.GreenGold;
    const paid = gg ? gg.confirm() : TRIP.fare;
    const contribution = gg ? gg.contribution() : 0;
    setDone({ paid, contribution });
  }

  const carbonKg = Math.round(TRIP.km * 0.21 * 100) / 100;

  return (
    <main className="min-h-screen bg-bg text-text flex flex-col">
      {/* Site header — landing/admin ile uyumlu */}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
          <Link href="/" className="font-extrabold text-base">
            🌿 Green Gold <span className="text-primary">Connect</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/" className="px-3 py-2 rounded-lg text-muted hover:text-text hover:bg-surface">
              Ana sayfa
            </Link>
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-[#256530]"
            >
              Admin Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center py-10 px-4">
        <div className="mb-5 text-center">
          <span className="inline-block text-xs font-semibold tracking-wide uppercase text-primary bg-primary-soft px-3 py-1 rounded-full">
            BiTaksi ödeme ekranı simülasyonu
          </span>
        </div>

        {/* Phone frame to evoke the BiTaksi app */}
        <div className="w-full max-w-[420px] bg-surface rounded-[28px] shadow-xl overflow-hidden border border-border">
          {/* App header */}
          <div className="bg-[#FFD400] px-5 py-4 flex items-center justify-between">
            <span className="font-extrabold text-[#1a1a1a] text-lg tracking-tight">
              Bi<span className="text-[#111]">Taksi</span>
            </span>
            <span className="text-xs font-semibold text-[#1a1a1a]/70">Ödeme</span>
          </div>

          {/* Map placeholder */}
          <div className="relative h-36 bg-gradient-to-br from-[#eaf6ec] to-[#d7e6da]">
            <div className="absolute inset-0 flex items-center justify-center text-primary/40 text-sm">
              🗺️ Rota haritası
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs font-semibold text-text">
              <span>📍 {TRIP.from}</span>
              <span className="text-muted">───────</span>
              <span>🏁 {TRIP.to}</span>
            </div>
          </div>

          <div className="p-5">
            <h1 className="text-base font-bold text-text">Yolculuk Tamamlandı</h1>
            <p className="text-sm text-muted mt-0.5">
              {TRIP.from} → {TRIP.to} · {TRIP.km} km · {TRIP.min} dk
            </p>

            <div className="mt-4 flex justify-between text-sm text-muted">
              <span>Tahmini Ücret</span>
              <span className="font-semibold text-text">
                {TRIP.fare.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
              </span>
            </div>

            {/* Widget mounts its green card here */}
            <div id="gg-mount" />

            {!done ? (
              <>
                <div className="mt-3 flex justify-between items-center border-t border-border pt-3">
                  <span className="text-sm font-semibold text-text">Ödenecek Toplam</span>
                  <span id="trip-total-val" className="text-lg font-extrabold text-primary">
                    {TRIP.fare.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                  </span>
                </div>

                <button
                  onClick={handleConfirm}
                  className="mt-4 w-full bg-primary hover:bg-[#256530] text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  Yolculuğu Onayla ve Öde
                </button>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-[#d8ead9] bg-primary-soft p-4 text-center">
                <div className="text-3xl">🌿</div>
                <p className="mt-2 font-bold text-text">Ödeme Başarılı!</p>
                <p className="text-sm text-primary mt-1">
                  {done.paid.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL ödendi
                </p>
                {done.contribution > 0 && (
                  <p className="text-xs text-muted mt-2">
                    Bu yolculuk karbon nötr! ~{carbonKg} kg CO₂ dengelendi ·{" "}
                    {done.contribution.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    TL katkı kaydedildi.
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-surface border border-border text-text font-semibold py-2.5 rounded-lg hover:border-primary"
                  >
                    Yeni Yolculuk
                  </button>
                  <Link
                    href="/admin/payouts"
                    className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-[#256530] flex items-center justify-center"
                  >
                    Panelde gör →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
