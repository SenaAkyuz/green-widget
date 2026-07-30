"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDomains } from "../../actions";

export function DomainsEditor({
  merchantId,
  initial,
}: {
  merchantId: string;
  initial: string[];
}) {
  const [value, setValue] = useState(initial.join(", "));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await updateDomains(merchantId, value);
    setBusy(false);
    if (res.ok) {
      setValue((res.allowed_domains ?? []).join(", "));
      setMsg("✓ Kaydedildi");
      router.refresh();
      setTimeout(() => setMsg(null), 1500);
    } else {
      setMsg(`✗ ${res.error}`);
    }
  }

  return (
    <div>
      <label className="block">
        <span className="text-xs text-muted">
          İzinli domain(ler) · virgülle ayır
        </span>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          placeholder="bitaksi.com, www.bitaksi.com"
          className="mt-1 w-full bg-surface border border-border text-text rounded-lg px-3 py-2 text-sm font-mono"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <button
          onClick={save}
          disabled={busy}
          className="text-sm font-semibold bg-primary hover:bg-[#256530] text-white px-3.5 py-2 rounded-lg disabled:opacity-60"
        >
          {busy ? "Kaydediliyor…" : "Domainleri kaydet"}
        </button>
        {msg && (
          <span
            className={`text-sm ${
              msg.startsWith("✓") ? "text-primary" : "text-red-600"
            }`}
          >
            {msg}
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted mt-2">
        Widget yalnızca bu domainlerden gelen işlemleri gerçek olarak kaydeder.
        Boş bırakılırsa işlemler ayarlanana kadar <b>demo</b> sayılır (gerçek geliri
        kirletmez).
      </p>
    </div>
  );
}
