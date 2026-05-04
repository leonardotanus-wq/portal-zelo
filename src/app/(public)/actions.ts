"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emailDaRevenda } from "@/lib/types";
import { trackEvento } from "@/lib/tracking";

type LoginState = {
  erro?: string;
};

export async function loginRevenda(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const usuario = String(formData.get("usuario") || "").trim();
  const senha = String(formData.get("senha") || "");

  if (!usuario || !senha) {
    return { erro: "Preencha usuário e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailDaRevenda(usuario),
    password: senha,
  });

  if (error) {
    return {
      erro: "Usuário ou senha incorretos. Verifique com seu vendedor.",
    };
  }

  if (data.user) {
    const { data: revenda } = await supabase
      .from("revendas")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (revenda) {
      await trackEvento(revenda, "login");
    }
  }

  redirect("/home");
}
