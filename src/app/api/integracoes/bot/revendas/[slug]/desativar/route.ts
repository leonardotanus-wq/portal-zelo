import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { autorizar, validarSlug } from "@/lib/integracoes/auth";

export const runtime = "nodejs";

export async function POST(
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

  const adminClient = createAdminClient();
  const { data: existing } = await adminClient
    .from("revendas")
    .select("id, ativa")
    .eq("nome_empresa", slugCheck.slug)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { erro: "Revenda não encontrada", codigo: "nao_existe" },
      { status: 404 },
    );
  }

  const { error } = await adminClient
    .from("revendas")
    .update({ ativa: false })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ativa: false });
}
