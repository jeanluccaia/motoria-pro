import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn("Supabase env vars not set. Auth will be unavailable.");
}

export const supabase = createClient(url || "", key || "");

export async function getIsPaid(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("is_paid")
    .eq("id", userId)
    .single();
  return data?.is_paid === true;
}
