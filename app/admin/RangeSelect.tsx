"use client";

import { useRouter } from "next/navigation";
import { RANGES } from "@/lib/range";

// Tarih aralığı dropdown'ı — ?range günceller, diğer paramları korur.
// window.location kullanır → useSearchParams (Suspense) gerekmez.
export function RangeSelect({
  current,
  className = "",
}: {
  current: string;
  className?: string;
}) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(window.location.search);
    params.set("range", e.target.value);
    router.push(`${window.location.pathname}?${params.toString()}`);
  }

  return (
    <select
      defaultValue={current}
      onChange={onChange}
      className={`text-sm bg-surface border border-border text-text rounded-lg px-3 py-2 min-h-11 cursor-pointer ${className}`}
    >
      {RANGES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
