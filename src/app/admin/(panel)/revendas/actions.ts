"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  if (!admin) throw new Error("Sem permissão.");
  return supabase;
}

export async function atualizarRevenda(input: {
  id: string;
  nome_responsavel: string | null;
  cidade: string | null;
  estado: string | null;
  vendedor_nome: string | null;
  vendedor_whatsapp: string | null;
}) {
  const supabase = await exigirAdmin();
  const wpp = (input.vendedor_whatsapp || "").replace(/\D+/g, "");
  if (wpp && !/^55\d{10,11}$/.test(wpp)) {
    return { ok: false as const, erro: "WhatsApp inválido (use 5531999999999)." };
  }

  const { error } = await supabase
    .from("revendas")
    .update({
      nome_responsavel: input.nome_responsavel?.trim() || null,
      cidade: input.cidade?.trim() || null,
      estado: input.estado?.trim() || null,
      vendedor_nome: input.vendedor_nome?.trim() || null,
      vendedor_whatsapp: wpp || null,
    })
    .eq("id", input.id);

  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/admin/revendas");
  return { ok: true as const };
}

export async function alternarAtivaRevenda(id: string, ativa: boolean) {
  const supabase = await exigirAdmin();
  const { error } = await supabase
    .from("revendas")
    .update({ ativa })
    .eq("id", id);
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/admin/revendas");
  return { ok: true as const };
}
