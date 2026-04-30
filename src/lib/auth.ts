import { createClient } from "@/lib/supabase/server";
import type { Revenda } from "@/lib/types";

export async function getRevendaLogada(): Promise<Revenda | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: revenda } = await supabase
    .from("revendas")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (revenda as Revenda | null) ?? null;
}

export async function getAdminLogado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (!admin) return null;
  return { user, admin };
}
