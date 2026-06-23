import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/analytics";

// GET /api/dashboard — overview KPIs + monthly trend + revenue-by-merchant.
export async function GET() {
  return NextResponse.json(await getDashboard());
}
