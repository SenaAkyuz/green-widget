// Green Gold Connect — carbon & contribution math.
// Mirrors the client widget (public/v1/gg-widget.js) so server + widget agree.

export type Sector = "mobility" | "delivery" | "ecommerce" | "hotel" | "dining";

// Carbon emission factors per the project context.
export const CARBON_FACTORS: Record<Sector, { factor: number; unit: string }> = {
  mobility: { factor: 0.21, unit: "kg CO₂/km" },
  delivery: { factor: 0.15, unit: "kg CO₂/order" },
  ecommerce: { factor: 0.5, unit: "kg CO₂/order" },
  hotel: { factor: 20, unit: "kg CO₂/night" }, // 12-35 range, avg
  dining: { factor: 0.8, unit: "kg CO₂/person" },
};

// Default contribution percentage per sector (used when no fixed/percent given).
const DEFAULT_PCT: Record<Sector, number> = {
  mobility: 1.5,
  delivery: 1.5,
  ecommerce: 1.0,
  hotel: 1.0,
  dining: 1.5,
};

function bounds(currency: string) {
  return currency === "EUR" || currency === "USD"
    ? { min: 1, max: 100 }
    : { min: 3, max: 500 };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CalcInput {
  amount: number;
  currency?: string;
  type?: string;
  fixed?: number;
  percent?: number;
  metadata?: Record<string, unknown>;
}

export interface CalcResult {
  carbon_kg: number;
  contribution_amount: number;
  percentage: number;
  total: number;
  currency: string;
}

// Estimate kg of CO₂ for a transaction. Uses explicit metadata when present
// (distance_km, nights, guests, people), otherwise an amount-based proxy.
export function estimateCarbon(
  type: string,
  amount: number,
  metadata: Record<string, unknown> = {}
): number {
  const sector = (type as Sector) in CARBON_FACTORS ? (type as Sector) : "mobility";
  const f = CARBON_FACTORS[sector].factor;
  const num = (k: string) => {
    const v = metadata[k];
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : undefined;
  };

  switch (sector) {
    case "mobility": {
      // Prefer distance; else proxy ~12 TL/km city fare → km estimate.
      const km = num("distance_km") ?? amount / 12;
      return round2(km * f);
    }
    case "hotel": {
      const nights = num("nights") ?? 1;
      const guests = num("guests") ?? 1;
      return round2(nights * guests * f);
    }
    case "dining": {
      const people = num("people") ?? Math.max(1, Math.round(amount / 250));
      return round2(people * f);
    }
    default:
      // delivery / ecommerce: per-order factor.
      return round2(f);
  }
}

// Contribution math, identical priority to the widget:
// fixed → percent → sector default; clamped to currency bounds.
export function calculate(input: CalcInput): CalcResult {
  const amount = Number(input.amount) || 0;
  const currency = input.currency || "TRY";
  const type = input.type || "mobility";
  const sector = (type as Sector) in CARBON_FACTORS ? (type as Sector) : "mobility";
  const { min, max } = bounds(currency);

  let contribution: number;
  let percentage: number;

  if (Number.isFinite(input.fixed)) {
    contribution = input.fixed as number;
    percentage = amount > 0 ? round2((contribution / amount) * 100) : 0;
  } else if (Number.isFinite(input.percent)) {
    percentage = input.percent as number;
    contribution = (amount * percentage) / 100;
  } else {
    percentage = DEFAULT_PCT[sector];
    contribution = (amount * percentage) / 100;
  }

  contribution = round2(Math.min(Math.max(contribution, min), max));

  return {
    carbon_kg: estimateCarbon(type, amount, input.metadata),
    contribution_amount: contribution,
    percentage,
    total: round2(amount + contribution),
    currency,
  };
}
