import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailDaRevenda } from "@/lib/types";
import { etapaValida } from "@/lib/jornada";

type Payload = {
  nome_empresa: string;
  nome_responsavel?: string;
  cidade?: string;
  estado?: string;
  vendedor_nome?: string;
  vendedor_whatsapp?: string;
  etapa_jornada?: number;
};

function validarNome(input: string) {
  return /^[a-z0-9]{2,40}$/.test(input);
}

function validarWhatsapp(input: string) {
  return /^55\d{10,11}$/.test(input);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ erro: "JSON inválido." }, { status: 400 });
  }

  const nome_empresa = String(body.nome_empresa || "").trim().toLowerCase();
  if (!validarNome(nome_empresa)) {
    return NextResponse.json(
      {
        erro:
          "Nome da empresa deve ter 2 a 40 caracteres, somente letras minúsculas e números, sem espaços.",
      },
      { status: 400 },
    );
  }

  const vendedor_whatsapp = String(body.vendedor_whatsapp || "").replace(
    /\D+/g,
    "",
  );
  if (vendedor_whatsapp && !validarWhatsapp(vendedor_whatsapp)) {
    return NextResponse.json(
      {
        erro: "WhatsApp inválido. Formato esperado: 5531999999999",
      },
      { status: 400 },
    );
  }

  const etapa_jornada =
    body.etapa_jornada === undefined ? 3 : Number(body.etapa_jornada);
  if (!etapaValida(etapa_jornada)) {
    return NextResponse.json(
      { erro: "Etapa da jornada inválida (use 1 a 6)." },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const email = emailDaRevenda(nome_empresa);

  const { data: existing } = await adminClient
    .from("revendas")
    .select("id")
    .eq("nome_empresa", nome_empresa)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { erro: "Já existe uma revenda com esse nome." },
      { status: 409 },
    );
  }

  const { data: created, error: createUserErr } =
    await adminClient.auth.admin.createUser({
      email,
      password: nome_empresa,
      email_confirm: true,
      user_metadata: { nome_empresa },
    });

  if (createUserErr || !created.user) {
    return NextResponse.json(
      {
        erro: createUserErr?.message || "Falha ao criar usuário no Auth.",
      },
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
      vendedor_whatsapp: vendedor_whatsapp || null,
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

  return NextResponse.json({ revenda });
}
