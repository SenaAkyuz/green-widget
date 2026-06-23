"use client";

import { useState } from "react";

export function SnippetBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="relative">
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-xs font-semibold bg-primary-soft text-primary hover:bg-[#dcefdf] px-3 py-1.5 rounded-lg"
      >
        {copied ? "✓ Kopyalandı" : "Kopyala"}
      </button>
      <pre className="p-5 pt-12 text-xs sm:text-[13px] text-[#1a3a22] bg-[#f6faf6] rounded-xl overflow-x-auto font-mono leading-relaxed border border-border">
        {code}
      </pre>
    </div>
  );
}
