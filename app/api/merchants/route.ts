import { NextResponse } from "next/server";
import { getMerchantsWithTotals } from "@/lib/analytics";

// GET /api/merchants — merchant list with rolled-up totals.
export async function GET() {
  const merchants = await getMerchantsWithTotals();
  return NextResponse.json({ count: merchants.length, merchants });
}
