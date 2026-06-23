import { NextRequest, NextResponse } from "next/server";
import {
  insertTransaction,
  listTransactions,
  getMerchant,
  type TxFilter,
} from "@/lib/store";
import {
  originHost,
  isLocalHost,
  domainAllowed,
  clientIp,
  rateLimited,
} from "@/lib/guard";

// Permissive CORS so the embeddable widget can POST from any partner origin.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// POST /api/transactions — widget payload (crypto.randomUUID session_id).
// Shape matches the `transactions` table: merchant_id, session_id,
// original_amount, contribution_amount, currency, type,
// contribution_selected, payment_status.
export async function POST(req: NextRequest) {
  // Rate limit: aynı IP'den dakikada 60 üstü istek → 429.
  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: CORS }
    );
  }

  try {
    const body = await req.json();
    const merchantId = body.merchant_id ? String(body.merchant_id) : "";
    if (!merchantId) {
      return NextResponse.json(
        { error: "merchant_id_required" },
        { status: 400, headers: CORS }
      );
    }

    // --- Origin doğrulama ---
    // Demo sayfası ?demo=1 ile çağırır → is_demo=true (gerçek veriyi kirletmez).
    const host = originHost(req);
    const demoFlag =
      req.nextUrl.searchParams.get("demo") === "1" || Boolean(body.is_demo);
    const merchant = await getMerchant(merchantId);

    // is_demo: demo flag, body, ya da merchant'ın kendisi demo ise true.
    let isDemo = demoFlag || Boolean(merchant?.is_demo);

    if (isLocalHost(host)) {
      // localhost → yerel test / CEO demo: her zaman kabul.
    } else if (!merchant) {
      // Bilinmeyen merchant'tan dış origin → reddet (sahte POST koruması).
      return NextResponse.json(
        { error: "merchant_unknown" },
        { status: 403, headers: CORS }
      );
    } else {
      const allowed = merchant.allowed_domains || [];
      if (allowed.length === 0) {
        // Henüz domain ayarlanmamış → engelleme ama gerçek geliri kirletme:
        // is_demo=true ile kabul et (admin allowed_domains girene kadar).
        isDemo = true;
      } else if (!domainAllowed(host, allowed)) {
        return NextResponse.json(
          { error: "origin_not_allowed" },
          { status: 403, headers: CORS }
        );
      }
    }

    const tx = await insertTransaction({
      merchant_id: merchantId,
      session_id: body.session_id,
      original_amount: Number(body.original_amount) || 0,
      contribution_amount: Number(body.contribution_amount) || 0,
      currency: body.currency || "TRY",
      type: body.type || "mobility",
      contribution_selected: Boolean(body.contribution_selected),
      payment_status: body.payment_status || "pending",
      stripe_session_id: body.stripe_session_id ?? null,
      metadata: body.metadata || {},
      is_demo: isDemo,
    });
    return NextResponse.json({ ok: true, transaction: tx }, { headers: CORS });
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: CORS }
    );
  }
}

// GET /api/transactions?merchant_id=&payment_status=&currency=&from=&to=&limit=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filter: TxFilter = {
    merchant_id: sp.get("merchant_id") || undefined,
    payment_status: sp.get("payment_status") || undefined,
    currency: sp.get("currency") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
  };
  const rows = await listTransactions(filter);
  return NextResponse.json({ count: rows.length, transactions: rows });
}
