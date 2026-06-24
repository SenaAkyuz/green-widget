import Link from "next/link";
import { widgetSrc } from "@/lib/site";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-text">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <span className="font-extrabold text-base">
            🌿 Green Gold <span className="text-primary">Connect</span>
          </span>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/demo" className="px-3 py-2 rounded-lg text-muted hover:text-text hover:bg-surface">
              Demo
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

      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center px-6 pt-20 pb-12">
        <span className="inline-block text-xs font-semibold tracking-wide uppercase text-primary bg-primary-soft px-3 py-1 rounded-full">
          Net Zero için tek satır kod
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold leading-[1.1] text-text">
          Her checkout'a{" "}
          <span className="text-primary">karbon nötrlük katkısı</span> ekleyin.
        </h1>
        <p className="mt-5 text-lg text-muted">
          CookieYes kadar basit. Uygulamanıza tek script tag ekleyin, her işlemden
          ortalama 5–6 TL sürdürülebilirlik katkısı toplayın. Sıfır teknik bilgi, 2
          dakikada entegrasyon.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Link
            href="/demo"
            className="bg-primary hover:bg-[#256530] text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            BiTaksi Demo'yu Aç
          </Link>
          <Link
            href="/admin"
            className="bg-surface border border-border hover:border-primary text-text px-6 py-3 rounded-xl font-bold transition-colors"
          >
            Admin Dashboard
          </Link>
        </div>
      </section>

      {/* Integration snippet */}
      <section className="max-w-2xl mx-auto px-6 pb-14">
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-xs text-muted mb-3 font-semibold">
            Partner tarafı entegrasyon — tek satır:
          </p>
          <pre className="text-xs sm:text-sm text-[#1a3a22] bg-[#f6faf6] rounded-xl p-4 overflow-x-auto font-mono leading-relaxed border border-border">
{`<script
  async
  src="${widgetSrc()}"
  data-merchant-id="MERCHANT001"
  data-amount="850"
  data-currency="TRY"
  data-type="ecommerce"
  data-locale="tr">
</script>`}
          </pre>
          <p className="text-[11px] text-muted mt-3">
            Tutarı checkout toplamınızdan dinamik basın (örn. şablon değişkeni{" "}
            <code className="text-primary font-semibold">{`data-amount="{{cart_total}}"`}</code>).
            Sabit değer yalnızca sabit fiyatlı sayfalar içindir. İleri seviye:{" "}
            <code className="text-primary font-semibold">{`data-target="#cart-total"`}</code>{" "}
            ile widget toplamı DOM'dan otomatik okur.
          </p>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="max-w-4xl mx-auto px-6 pb-14">
        <h2 className="text-center text-sm font-bold uppercase tracking-wide text-muted mb-6">
          Nasıl çalışır
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: 1, t: "Tek satırı yapıştır", d: "Checkout sayfasına ya da app'ine script/SDK satırını ekle." },
            { n: 2, t: "Widget katkıyı sunar", d: "Müşteri tek dokunuşla yolculuğunu karbon nötr yapar." },
            { n: 3, t: "Kazanç panoya düşer", d: "Her işlem admin dashboard'a ve payout havuzuna işlenir." },
          ].map((s) => (
            <div key={s.n} className="bg-surface border border-border rounded-2xl shadow-sm p-5">
              <span className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                {s.n}
              </span>
              <div className="mt-3 font-semibold text-text">{s.t}</div>
              <div className="text-sm text-muted mt-1">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { v: "%70–85", l: "Kabul oranı" },
          { v: "~6 TL", l: "Ortalama katkı" },
          { v: "2 dk", l: "Entegrasyon" },
          { v: "0.21", l: "kg CO₂/km faktör" },
        ].map((s) => (
          <div key={s.l} className="bg-surface rounded-2xl p-4 text-center border border-border shadow-sm">
            <div className="text-2xl font-extrabold text-primary">{s.v}</div>
            <div className="text-xs text-muted mt-1">{s.l}</div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted">
          <span>🌿 Green Gold Connect · MVP</span>
          <div className="flex gap-4">
            <Link href="/demo" className="hover:text-text">Demo</Link>
            <Link href="/admin" className="hover:text-text">Admin</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
