// Demo verisini temizle — sadece is_demo=true satırları siler. Gerçek veriye dokunmaz.
//   node --env-file=.env.local scripts/reset.mjs

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yok.");
  process.exit(1);
}

const h = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function del(table) {
  const res = await fetch(`${URL}/rest/v1/${table}?is_demo=eq.true`, {
    method: "DELETE",
    headers: { ...h, Prefer: "return=representation" },
  });
  if (!res.ok) throw new Error(`${res.status} ${table}: ${await res.text()}`);
  const rows = await res.json();
  return rows.length;
}

async function main() {
  const tx = await del("transactions");
  const m = await del("merchants");
  console.log(`✓ Demo verisi silindi: ${tx} işlem, ${m} merchant.`);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
