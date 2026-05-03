"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRevendaLogada } from "@/lib/auth";
import { enviarEmailNovoVideo } from "@/lib/email";

export async function registrarVideoEnviado(input: {
  arquivoPath: string;
  nomeArquivo: string;
}) {
  const revenda = await getRevendaLogada();
  if (!revenda) {
    return { ok: false as const, erro: "Sessão expirada. Entre novamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("videos_instalacao").insert({
    revenda_id: revenda.id,
    arquivo_path: input.arquivoPath,
    nome_arquivo: input.nomeArquivo,
    status: "pendente",
  });

  if (error) {
    return { ok: false as const, erro: error.message };
  }

  await enviarEmailNovoVideo({
    nomeEmpresa: revenda.nome_empresa,
    nomeResponsavel: revenda.nome_responsavel,
    cidade: revenda.cidade,
    estado: revenda.estado,
    vendedorWhatsapp: revenda.vendedor_whatsapp,
    nomeArquivo: input.nomeArquivo,
    enviadoEm: new Date(),
  });

  revalidatePath("/upload-video");
  return { ok: true as const };
}
