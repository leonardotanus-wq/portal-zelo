import { Resend } from "resend";

const TIMEOUT_MS = 5000;

export type NovoVideoPayload = {
  nomeEmpresa: string;
  nomeResponsavel: string | null;
  cidade: string | null;
  estado: string | null;
  vendedorWhatsapp: string | null;
  nomeArquivo: string;
  enviadoEm: Date;
};

function isPlaceholder(key: string | undefined): boolean {
  return !key || key.includes("PLACEHOLDER") || key === "re_xxxxx_PLACEHOLDER";
}

function formatarData(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function escape(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function montarHtml(payload: NovoVideoPayload, painelUrl: string): string {
  const cidadeEstado =
    payload.cidade || payload.estado
      ? `${escape(payload.cidade)}/${escape(payload.estado)}`
      : "—";

  return `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:32px 32px 16px;">
                <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#18181b;">📹 Novo vídeo de instalação</h1>
                <p style="margin:0;color:#52525b;font-size:14px;">Nova revenda enviou vídeo de instalação:</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafafa;border-radius:12px;padding:20px;font-size:14px;line-height:1.6;">
                  <tr><td style="color:#71717a;width:140px;">Revenda:</td><td style="color:#18181b;font-weight:600;">${escape(payload.nomeEmpresa)}</td></tr>
                  <tr><td style="color:#71717a;">Responsável:</td><td style="color:#18181b;">${escape(payload.nomeResponsavel)}</td></tr>
                  <tr><td style="color:#71717a;">Cidade/Estado:</td><td style="color:#18181b;">${cidadeEstado}</td></tr>
                  <tr><td style="color:#71717a;">WhatsApp:</td><td style="color:#18181b;">${escape(payload.vendedorWhatsapp)}</td></tr>
                  <tr><td style="color:#71717a;">Data/Hora:</td><td style="color:#18181b;">${escape(formatarData(payload.enviadoEm))}</td></tr>
                  <tr><td style="color:#71717a;">Arquivo:</td><td style="color:#18181b;">${escape(payload.nomeArquivo)}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 32px;">
                <a href="${escape(painelUrl)}" style="display:inline-block;background:#FACC15;color:#18181b;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;">Ver no painel admin</a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;">Zelo Portal — notificação automática</p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timeout após ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function enviarEmailNovoVideo(
  payload: NovoVideoPayload,
): Promise<{ enviado: boolean; motivo?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_ADMIN;
  const from = process.env.EMAIL_FROM;

  if (isPlaceholder(apiKey)) {
    console.log(
      "[email] Email não enviado: RESEND_API_KEY não configurada (placeholder).",
    );
    return { enviado: false, motivo: "placeholder" };
  }
  if (!to || !from) {
    console.error(
      "[email] EMAIL_ADMIN ou EMAIL_FROM ausentes — email não enviado.",
    );
    return { enviado: false, motivo: "config" };
  }

  const painelUrl = "https://portal-zelo.vercel.app/admin/videos";
  const subject = `📹 Novo vídeo de instalação — ${payload.nomeEmpresa}`;
  const html = montarHtml(payload, painelUrl);

  try {
    const resend = new Resend(apiKey);
    const result = await withTimeout(
      resend.emails.send({ from, to, subject, html }),
      TIMEOUT_MS,
    );
    if (result.error) {
      console.error("[email] Falha ao enviar:", result.error);
      return { enviado: false, motivo: result.error.message };
    }
    console.log("[email] Notificação enviada — id:", result.data?.id);
    return { enviado: true };
  } catch (err) {
    console.error("[email] Exceção ao enviar:", err);
    return {
      enviado: false,
      motivo: err instanceof Error ? err.message : "erro desconhecido",
    };
  }
}
