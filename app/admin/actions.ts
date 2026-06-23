"use server";

import { revalidatePath } from "next/cache";
import { insertMerchant, insertPayout, updateMerchantDomains } from "@/lib/store";
import { parseDomains } from "@/lib/guard";

export async function createMerchant(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "İsim gerekli" };

  const sector = String(formData.get("sector") || "ecommerce");
  const city = String(formData.get("city") || "").trim();
  const currency = String(formData.get("currency") || "TRY");
  const fixedRaw = String(formData.get("default_fixed") || "").trim();
  const pctRaw = String(formData.get("default_percentage") || "").trim();
  const allowed_domains = parseDomains(String(formData.get("allowed_domains") || ""));

  const merchant = await insertMerchant({
    name,
    sector,
    city,
    currency,
    default_fixed: fixedRaw ? Number(fixedRaw) : null,
    default_percentage: pctRaw ? Number(pctRaw) : null,
    allowed_domains,
  });

  revalidatePath("/admin/partners");
  revalidatePath("/admin");
  return { ok: true, merchant_id: merchant.merchant_id };
}

// Partner detay sayfasından izinli domain listesini günceller.
export async function updateDomains(merchant_id: string, csv: string) {
  if (!merchant_id) return { ok: false, error: "merchant_id gerekli" };
  const allowed_domains = parseDomains(csv);
  const m = await updateMerchantDomains(merchant_id, allowed_domains);
  if (!m) return { ok: false, error: "Merchant bulunamadı" };
  revalidatePath(`/admin/partners/${merchant_id}`);
  revalidatePath("/admin/partners");
  return { ok: true, allowed_domains };
}

export async function markPaid(input: {
  merchant_id: string;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
}) {
  await insertPayout({
    merchant_id: input.merchant_id,
    amount: input.amount,
    currency: input.currency,
    period_start: input.period_start,
    period_end: input.period_end,
    status: "paid",
    paid_at: new Date().toISOString(),
  });
  revalidatePath("/admin/payouts");
  return { ok: true };
}
