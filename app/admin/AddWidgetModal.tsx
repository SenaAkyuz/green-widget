"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createMerchant } from "./actions";

const SECTORS = [
  { value: "mobility", label: "Mobility (taksi/araç)" },
  { value: "delivery", label: "Delivery (yemek teslimat)" },
  { value: "ecommerce", label: "E-ticaret" },
  { value: "hotel", label: "Otel" },
  { value: "dining", label: "Restoran" },
];

export function AddWidgetModal({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createMerchant(new FormData(e.currentTarget));
    setBusy(false);
    if (res.ok) {
      setMsg(`✓ Eklendi: ${res.merchant_id}`);
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setMsg(null);
      }, 900);
    } else {
      setMsg(`✗ ${res.error}`);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className={`text-sm font-semibold bg-primary hover:bg-[#256530] text-white px-3.5 py-2 min-h-11 rounded-lg transition-colors whitespace-nowrap ${className}`}
      >
        + Widget Ekle
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-widget-title"
            className="bg-surface rounded-2xl shadow-xl border border-border w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="add-widget-title" className="text-lg font-extrabold text-text">
                Yeni Widget / Merchant
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="flex items-center justify-center w-9 h-9 -mr-1.5 rounded-lg text-muted hover:text-text hover:bg-bg text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Merchant adı" name="name" required placeholder="Örn. BiTaksi" />
              <label className="block">
                <span className="text-xs text-muted">Sektör</span>
                <select
                  name="sector"
                  defaultValue="ecommerce"
                  className="mt-1 w-full bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm"
                >
                  {SECTORS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Şehir" name="city" placeholder="İstanbul" />
                <label className="block">
                  <span className="text-xs text-muted">Para birimi</span>
                  <select
                    name="currency"
                    defaultValue="TRY"
                    className="mt-1 w-full bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="TRY">TRY</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Sabit katkı (TL)" name="default_fixed" type="number" placeholder="6.50" />
                <Field label="VEYA % oran" name="default_percentage" type="number" placeholder="1.5" />
              </div>
              <Field
                label="İzinli domain(ler)"
                name="allowed_domains"
                placeholder="bitaksi.com, www.bitaksi.com"
              />
              <p className="text-[11px] text-muted -mt-1">
                Virgülle ayır. Widget yalnızca bu domainlerden işlem yazabilir. Boş
                bırakılırsa işlemler ayarlanana kadar <b>demo</b> sayılır.
              </p>

              {msg && (
                <p
                  className={`text-sm ${
                    msg.startsWith("✓") ? "text-primary" : "text-red-600"
                  }`}
                >
                  {msg}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 bg-primary hover:bg-[#256530] text-white font-bold py-2.5 rounded-lg disabled:opacity-60"
                >
                  {busy ? "Ekleniyor…" : "Ekle"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-muted hover:text-text"
                >
                  İptal
                </button>
              </div>
            </form>
            <p className="text-[11px] text-muted mt-3">
              merchant_id otomatik üretilir · is_demo=false (gerçek)
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        name={name}
        type={type}
        step="any"
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm"
      />
    </label>
  );
}
