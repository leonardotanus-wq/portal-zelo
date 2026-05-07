import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  autorizar,
  validarSlug,
  validarWhatsapp,
} from "@/lib/integracoes/auth";

export const runtime = "nodejs";

type Payload = {
  nome_responsavel?: string | null;
  cidade?: string | null;
  estado?: string | null;
  vendedor_nome?: string | null;
  vendedor_whatsapp?: string | null;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = autorizar(request);
  if (!auth.ok) {
    return NextResponse.json({ erro: auth.erro }, { status: 401 });
  }

  const { slug: slugParam } = await context.params;
  const slugCheck = validarSlug(slugParam);
  if (!slugCheck.ok) {
    return NextResponse.json({ erro: slugCheck.erro }, { status: 400 });
  }
  const slug = slugCheck.slug;

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const wppCheck = validarWhatsapp(body.vendedor_whatsapp);
  if (!wppCheck.ok) {
    return NextResponse.json({ erro: wppCheck.erro }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from("revendas")
    .select("id")
    .eq("nome_empresa", slug)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json(
      { erro: "Revenda não encontrada", codigo: "nao_existe" },
      { status: 404 },
    );
  }

  const { data: revenda, error: updateErr } = await adminClient
    .from("revendas")
    .update({
      nome_responsavel: body.nome_responsavel?.trim() || null,
      cidade: body.cidade?.trim() || null,
      estado: body.estado?.trim() || null,
      vendedor_nome: body.vendedor_nome?.trim() || null,
      vendedor_whatsapp: wppCheck.whatsapp,
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ erro: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    revenda: {
      id: revenda.id,
      nome_empresa: revenda.nome_empresa,
      cidade: revenda.cidade,
      estado: revenda.estado,
      ativa: revenda.ativa,
    },
  });
}
