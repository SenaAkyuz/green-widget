// Tarih aralığı seçenekleri (header dropdown).
export const RANGES: { value: string; label: string; days: number | null }[] = [
  { value: "7d", label: "Son 7 Gün", days: 7 },
  { value: "30d", label: "Son 30 Gün", days: 30 },
  { value: "3m", label: "Son 3 Ay", days: 90 },
  { value: "6m", label: "Son 6 Ay", days: 180 },
  { value: "all", label: "Tümü", days: null },
];

export const DEFAULT_RANGE = "6m";

export function rangeToFrom(range?: string): string | undefined {
  const r = RANGES.find((x) => x.value === (range || DEFAULT_RANGE));
  if (!r || r.days === null) return undefined;
  return new Date(Date.now() - r.days * 864e5).toISOString();
}

export function rangeLabel(range?: string): string {
  return RANGES.find((x) => x.value === (range || DEFAULT_RANGE))?.label ?? "Son 6 Ay";
}
