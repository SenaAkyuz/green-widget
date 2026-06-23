// Thin server-side Supabase REST (PostgREST) client — no SDK dependency.
// Uses the service-role key, so this module must only run on the server.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(URL && KEY);

async function rest(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY as string,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status} on ${path}: ${body}`);
  }
  return res;
}

export async function sbSelect<T>(table: string, query = ""): Promise<T[]> {
  const res = await rest(`${table}${query ? `?${query}` : ""}`);
  return res.json();
}

export async function sbInsert<T>(
  table: string,
  row: Record<string, unknown>
): Promise<T> {
  const res = await rest(table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  const rows = (await res.json()) as T[];
  return rows[0];
}

// PATCH with a PostgREST filter query (e.g. `merchant_id=eq.ABC`).
export async function sbUpdate<T>(
  table: string,
  query: string,
  patch: Record<string, unknown>
): Promise<T> {
  const res = await rest(`${table}?${query}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  const rows = (await res.json()) as T[];
  return rows[0];
}
