import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  autorizar,
  validarSlug,
  gerarSenhaAleatoria,
} from "@/lib/integracoes/auth";

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
  const { data: revenda } = await adminClient
    .from("revendas")
    .select("id, user_id")
    .eq("nome_empresa", slugCheck.slug)
    .maybeSingle();

  if (!revenda || !revenda.user_id) {
    return NextResponse.json(
      {
        erro: "Revenda não encontrada ou sem user_id",
        codigo: "nao_existe",
      },
      { status: 404 },
    );
  }

  const novaSenha = gerarSenhaAleatoria();

  const { error } = await adminClient.auth.admin.updateUserById(
    revenda.user_id,
    { password: novaSenha },
  );

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({
    credencial: {
      login: slugCheck.slug,
      senha: novaSenha,
    },
  });
}
