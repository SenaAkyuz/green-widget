"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markPaid } from "../actions";

export function MarkPaidButton({
  merchant_id,
  amount,
  currency,
  period_start,
  period_end,
}: {
  merchant_id: string;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onClick() {
    setBusy(true);
    await markPaid({ merchant_id, amount, currency, period_start, period_end });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="text-xs font-semibold bg-primary hover:bg-[#256530] text-white px-3 py-1.5 rounded-lg disabled:opacity-60"
    >
      {busy ? "…" : "Ödendi işaretle"}
    </button>
  );
}
