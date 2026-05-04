import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatarDataBr(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function isPlaceholder(key: string | undefined): boolean {
  return !key || key.includes("PLACEHOLDER");
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || isPlaceholder(expected)) {
    return NextResponse.json(
      { ok: false, erro: "CRON_SECRET não configurado" },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${expected}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const agora = new Date();
  const seteDiasAtras = new Date(agora.getTime() - 7 * 86400000);
  const quatorzeDiasAtras = new Date(agora.getTime() - 14 * 86400000);

  const [logins, cliques, ativas, sumidas, topRevendas] = await Promise.all([
    supabase
      .from("eventos_revenda")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "login")
      .gte("created_at", seteDiasAtras.toISOString()),
    supabase
      .from("eventos_revenda")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "click_botao")
      .gte("created_at", seteDiasAtras.toISOString()),
    supabase
      .from("revendas")
      .select("id", { count: "exact", head: true })
      .eq("ativa", true)
      .gte("ultimo_login_at", seteDiasAtras.toISOString()),
    supabase
      .from("revendas")
      .select("nome_empresa, ultimo_login_at")
      .eq("ativa", true)
      .or(
        `ultimo_login_at.is.null,ultimo_login_at.lt.${quatorzeDiasAtras.toISOString()}`,
      ),
    supabase.rpc("top_revendas_semana"),
  ]);

  const sumidasList = (sumidas.data ?? []) as {
    nome_empresa: string;
    ultimo_login_at: string | null;
  }[];
  const topList = (topRevendas.data ?? []) as {
    nome_empresa: string;
    total: number;
  }[];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal-zelo.vercel.app";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;">
      <h1 style="margin:0 0 16px;font-size:22px;">📊 Relatório Semanal — Zelo Portal</h1>
      <p style="color:#52525b;margin:0 0 16px;">Resumo dos últimos 7 dias:</p>
      <ul style="line-height:1.8;font-size:15px;padding-left:20px;margin:0 0 24px;">
        <li><strong>${logins.count ?? 0}</strong> logins na semana</li>
        <li><strong>${cliques.count ?? 0}</strong> cliques em botões</li>
        <li><strong>${ativas.count ?? 0}</strong> revendas ativas</li>
        <li><strong style="color:#dc2626">${sumidasList.length}</strong> revendas sumidas (14+ dias)</li>
      </ul>

      <h2 style="font-size:16px;margin:24px 0 8px;">🏆 Top revendas da semana</h2>
      ${
        topList.length === 0
          ? `<p style="color:#a1a1aa">Sem logins nesta semana.</p>`
          : `<ol style="line-height:1.8;font-size:14px;padding-left:20px;margin:0;">
              ${topList.map((r) => `<li>${escapeHtml(r.nome_empresa)} — ${r.total} login${r.total === 1 ? "" : "s"}</li>`).join("")}
            </ol>`
      }

      ${
        sumidasList.length > 0
          ? `<h2 style="font-size:16px;margin:24px 0 8px;">⚠️ Atenção — revendas que sumiram</h2>
             <ul style="line-height:1.8;font-size:14px;padding-left:20px;margin:0;">
               ${sumidasList
                 .map(
                   (r) =>
                     `<li>${escapeHtml(r.nome_empresa)} — último login: ${
                       r.ultimo_login_at ? formatarDataBr(r.ultimo_login_at) : "nunca"
                     }</li>`,
                 )
                 .join("")}
             </ul>`
          : ""
      }

      <p style="margin-top:32px;text-align:center;">
        <a href="${escapeHtml(siteUrl)}/admin/engajamento"
           style="background:#FFD500;color:#2B2B2B;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
          Ver painel completo →
        </a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;text-align:center;">
        Zelo Portal — relatório automático
      </p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_ADMIN;
  const from = process.env.EMAIL_FROM;

  if (isPlaceholder(apiKey) || !to || !from) {
    console.log(
      "[cron-semanal] RESEND/EMAIL não configurado — email não enviado.",
    );
    return NextResponse.json({
      ok: true,
      enviado: false,
      motivo: "config",
      stats: {
        logins: logins.count ?? 0,
        cliques: cliques.count ?? 0,
        ativas: ativas.count ?? 0,
        sumidas: sumidasList.length,
      },
    });
  }

  const resend = new Resend(apiKey);
  const subject = `📊 Relatório Semanal — Zelo Portal (${formatarDataBr(agora.toISOString())})`;

  try {
    const result = await resend.emails.send({ from, to, subject, html });
    if (result.error) {
      console.error("[cron-semanal] Falha ao enviar:", result.error);
      return NextResponse.json(
        { ok: false, erro: result.error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, enviado: true, id: result.data?.id });
  } catch (err) {
    console.error("[cron-semanal] Exceção ao enviar:", err);
    return NextResponse.json(
      { ok: false, erro: err instanceof Error ? err.message : "erro" },
      { status: 500 },
    );
  }
}
