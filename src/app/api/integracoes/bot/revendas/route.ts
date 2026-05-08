import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailDaRevenda } from "@/lib/types";
import { etapaValida } from "@/lib/jornada";
import {
  autorizar,
  validarSlug,
  validarWhatsapp,
  validarSenha,
  gerarSenhaAleatoria,
} from "@/lib/integracoes/auth";

export const runtime = "nodejs";

// Fase 7 Etapa 3a: payload aceita campo opcional `senha`. Quando presente,
// usado em vez de gerar senha aleatória. Caracteres aceitos: a-z, 0-9
// (6-40 chars). Bot vai mandar exatamente igual ao slug — login = senha
// pra UX simples. Compat com chamadas atuais preservada: payload sem
// `senha` continua gerando aleatória de 16 chars.
type Payload = {
  nome_empresa: string;
  nome_responsavel?: string | null;
  cidade?: string | null;
  estado?: string | null;
  vendedor_nome?: string | null;
  vendedor_whatsapp?: string | null;
  etapa_jornada?: number;
  senha?: string;
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

  // Senha: se vier no payload, valida e usa; senão gera aleatória.
  // Falha de validação retorna 422 com codigo='senha_invalida' pra o Bot
  // distinguir desse caso de outros 400s.
  let senha: string;
  let senhaOrigem: "fornecida" | "gerada";
  if (body.senha !== undefined && body.senha !== null) {
    const senhaCheck = validarSenha(body.senha);
    if (!senhaCheck.ok) {
      return NextResponse.json(
        { erro: senhaCheck.erro, codigo: "senha_invalida" },
        { status: 422 },
      );
    }
    senha = senhaCheck.senha;
    senhaOrigem = "fornecida";
  } else {
    senha = gerarSenhaAleatoria();
    senhaOrigem = "gerada";
  }

  const adminClient = createAdminClient();
  const email = emailDaRevenda(nome_empresa);

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

  // Observabilidade: registra origem da senha pra auditoria. Não logamos
  // a senha em si — apenas se veio do payload ou foi gerada.
  console.log(
    `[bot/revendas] revenda criada nome_empresa=${nome_empresa} senha_origem=${senhaOrigem}`,
  );

  // Senha plaintext retornada UMA VEZ. Bot precisa exibir pro admin
  // imediatamente — não há recuperação posterior. Quando senha veio do
  // payload, devolvemos exatamente a mesma string — Bot trata o response
  // como fonte de verdade da credencial.
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
