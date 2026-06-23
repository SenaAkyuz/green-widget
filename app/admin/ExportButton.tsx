"use client";

// Görünür veriyi CSV olarak indirir (kütüphane yok).
export function ExportButton({
  rows,
  filename,
}: {
  rows: Record<string, unknown>[];
  filename: string;
}) {
  function download() {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      cols.join(","),
      ...rows.map((r) => cols.map((c) => esc(r[c])).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="text-sm font-semibold border border-border text-text hover:bg-primary-soft px-3.5 py-2 rounded-lg transition-colors"
    >
      ⤓ Dışa Aktar
    </button>
  );
}
