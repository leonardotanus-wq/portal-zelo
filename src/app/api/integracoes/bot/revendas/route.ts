import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailDaRevenda } from "@/lib/types";
import { etapaValida } from "@/lib/jornada";
import {
  autorizar,
  validarSlug,
  validarWhatsapp,
  gerarSenhaAleatoria,
} from "@/lib/integracoes/auth";

export const runtime = "nodejs";

type Payload = {
  nome_empresa: string;
  nome_responsavel?: string | null;
  cidade?: string | null;
  estado?: string | null;
  vendedor_nome?: string | null;
  vendedor_whatsapp?: string | null;
  etapa_jornada?: number;
};

export async function POST(request: Request) {
  const auth = autorizar(request);
  if (!auth.ok) {
    return NextResponse.json({ erro: auth.erro }, { status: 401 });
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const slugCheck = validarSlug(body.nome_empresa);
  if (!slugCheck.ok) {
    return NextResponse.json({ erro: slugCheck.erro }, { status: 400 });
  }
  const nome_empresa = slugCheck.slug;

  const wppCheck = validarWhatsapp(body.vendedor_whatsapp);
  if (!wppCheck.ok) {
    return NextResponse.json({ erro: wppCheck.erro }, { status: 400 });
  }
  const vendedor_whatsapp = wppCheck.whatsapp;

  const etapa_jornada =
    body.etapa_jornada === undefined ? 3 : Number(body.etapa_jornada);
  if (!etapaValida(etapa_jornada)) {
    return NextResponse.json(
      { erro: "etapa_jornada inválida (use 1 a 6)" },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const email = emailDaRevenda(nome_empresa);
  const senha = gerarSenhaAleatoria();

  // Idempotência: se já existe, retorna 409 (Bot trata como "já sincronizada").
  const { data: existing } = await adminClient
    .from("revendas")
    .select("id")
    .eq("nome_empresa", nome_empresa)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { erro: "Revenda já existe", codigo: "ja_existe" },
      { status: 409 },
    );
  }

  const { data: created, error: createUserErr } =
    await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome_empresa },
    });

  if (createUserErr || !created.user) {
    return NextResponse.json(
      { erro: createUserErr?.message || "Falha ao criar usuário no Auth" },
      { status: 500 },
    );
  }

  const { data: revenda, error: insertErr } = await adminClient
    .from("revendas")
    .insert({
      nome_empresa,
      nome_responsavel: body.nome_responsavel?.trim() || null,
      cidade: body.cidade?.trim() || null,
      estado: body.estado?.trim() || null,
      vendedor_nome: body.vendedor_nome?.trim() || null,
      vendedor_whatsapp,
      etapa_jornada,
      ativa: true,
      user_id: created.user.id,
    })
    .select()
    .single();

  if (insertErr) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ erro: insertErr.message }, { status: 500 });
  }

  // Senha plaintext retornada UMA VEZ. Bot precisa exibir pro admin
  // imediatamente — não há recuperação posterior.
  return NextResponse.json(
    {
      revenda: {
        id: revenda.id,
        nome_empresa: revenda.nome_empresa,
        cidade: revenda.cidade,
        estado: revenda.estado,
        ativa: revenda.ativa,
        created_at: revenda.created_at,
      },
      credencial: {
        login: nome_empresa,
        senha,
      },
    },
    { status: 201 },
  );
}
