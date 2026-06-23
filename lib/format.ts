export function money(n: number, currency = "TRY"): string {
  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : "TL";
  const formatted = n.toLocaleString(currency === "TRY" ? "tr-TR" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return currency === "TRY" ? `${formatted} ${sym}` : `${sym}${formatted}`;
}

export function num(n: number): string {
  return n.toLocaleString("tr-TR");
}

export function date(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
