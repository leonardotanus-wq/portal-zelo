"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StatusVideo } from "@/lib/types";

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

export async function atualizarStatusVideo(input: {
  id: string;
  status: StatusVideo;
}) {
  const supabase = await exigirAdmin();
  const { error } = await supabase
    .from("videos_instalacao")
    .update({ status: input.status })
    .eq("id", input.id);
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/admin/videos");
  return { ok: true as const };
}

export async function atualizarObservacaoVideo(input: {
  id: string;
  observacao: string;
}) {
  const supabase = await exigirAdmin();
  const { error } = await supabase
    .from("videos_instalacao")
    .update({ observacao: input.observacao || null })
    .eq("id", input.id);
  if (error) return { ok: false as const, erro: error.message };
  revalidatePath("/admin/videos");
  return { ok: true as const };
}

export async function gerarLinkDownloadVideo(arquivoPath: string) {
  const supabase = await exigirAdmin();
  const { data, error } = await supabase.storage
    .from("videos-instalacao")
    .createSignedUrl(arquivoPath, 60 * 60);
  if (error || !data) {
    return { ok: false as const, erro: error?.message ?? "Falha ao gerar link." };
  }
  return { ok: true as const, url: data.signedUrl };
}
