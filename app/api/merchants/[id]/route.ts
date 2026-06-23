import { NextRequest, NextResponse } from "next/server";
import { getMerchant, listTransactions } from "@/lib/store";

// GET /api/merchants/[id] — single merchant detail + recent transactions + KPIs.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const tx = await listTransactions({ merchant_id: merchant.merchant_id });
  const accepted = tx.filter((t) => t.contribution_selected);
  const revenue = tx.reduce((s, t) => s + t.contribution_amount, 0);
  const carbon = tx.reduce((s, t) => s + (t.contribution_selected ? t.carbon_kg : 0), 0);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const monthlyRevenue = tx
    .filter((t) => t.created_at >= monthAgo)
    .reduce((s, t) => s + t.contribution_amount, 0);

  return NextResponse.json({
    merchant,
    kpis: {
      total_revenue: Math.round(revenue * 100) / 100,
      monthly_revenue: Math.round(monthlyRevenue * 100) / 100,
      transaction_count: tx.length,
      carbon_kg: Math.round(carbon * 100) / 100,
      acceptance_rate: tx.length ? Math.round((accepted.length / tx.length) * 100) : 0,
    },
    recent_transactions: tx.slice(0, 10),
  });
}
