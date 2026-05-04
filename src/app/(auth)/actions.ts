"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRevendaLogada } from "@/lib/auth";
import { trackEvento } from "@/lib/tracking";

export async function logout() {
  const revenda = await getRevendaLogada();
  if (revenda) {
    await trackEvento(revenda, "logout");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
