import { NextRequest, NextResponse } from "next/server";
import { calculate } from "@/lib/carbon";

// POST /api/calculate — { merchant_id, amount, currency, type, fixed?, percent?, metadata? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = calculate({
      amount: Number(body.amount),
      currency: body.currency,
      type: body.type,
      fixed: body.fixed !== undefined ? Number(body.fixed) : undefined,
      percent: body.percent !== undefined ? Number(body.percent) : undefined,
      metadata: body.metadata,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
