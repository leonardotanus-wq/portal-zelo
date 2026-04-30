"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaMaterial } from "@/lib/types";

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

export async function registrarMaterial(input: {
  titulo: string;
  descricao: string | null;
  categoria: CategoriaMaterial;
  arquivo_path: string;
  arquivo_url: string;
  tamanho_bytes: number | null;
}) {
  const supabase = await exigirAdmin();
  if (!input.titulo.trim()) {
    return { ok: false as const, erro: "Informe um título." };
  }
  const { error } = await supabase.from("materiais").insert({
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || null,
    categoria: input.categoria,
    arquivo_path: input.arquivo_path,
    arquivo_url: input.arquivo_url,
    tamanho_bytes: input.tamanho_bytes,
  });
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/admin/materiais");
  return { ok: true as const };
}

export async function deletarMaterial(id: string) {
  const supabase = await exigirAdmin();
  const { data: material } = await supabase
    .from("materiais")
    .select("arquivo_path")
    .eq("id", id)
    .maybeSingle();

  if (material?.arquivo_path) {
    await supabase.storage.from("materiais").remove([material.arquivo_path]);
  }

  const { error } = await supabase.from("materiais").delete().eq("id", id);
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/admin/materiais");
  return { ok: true as const };
}
