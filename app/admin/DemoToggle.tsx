"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// "Demo verisini göster" switch. Default ON. When OFF (?demo=0), the
// server pages return only real (is_demo=false) rows — i.e. live transactions.
export function DemoToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoOn = searchParams.get("demo") !== "0";

  function toggle() {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (demoOn) params.set("demo", "0");
    else params.delete("demo");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="px-5 py-3 border-t border-border">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between text-xs text-muted hover:text-text"
        title="Kapatınca sadece gerçek (canlı) işlemler gösterilir"
      >
        <span>Demo verisini göster</span>
        <span
          className={`relative w-9 h-5 rounded-full transition-colors ${
            demoOn ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              demoOn ? "left-[18px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </div>
  );
}
