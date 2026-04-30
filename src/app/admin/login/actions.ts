"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LoginAdminState = {
  erro?: string;
};

export async function loginAdmin(
  _prev: LoginAdminState,
  formData: FormData,
): Promise<LoginAdminState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");

  if (!email || !senha) {
    return { erro: "Preencha email e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    return { erro: "Email ou senha incorretos." };
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { erro: "Esta conta não tem permissão de administrador." };
  }

  redirect("/admin");
}
