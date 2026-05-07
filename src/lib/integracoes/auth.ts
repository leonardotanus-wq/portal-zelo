import { randomBytes } from "node:crypto";

export type AutorizacaoResult = { ok: true } | { ok: false; erro: string };

export function autorizar(request: Request): AutorizacaoResult {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return { ok: false, erro: "Authorization header missing or malformed" };
  }
  const token = match[1].trim();
  const expected = process.env.BOT_API_TOKEN;
  if (!expected || expected.length < 32) {
    return { ok: false, erro: "BOT_API_TOKEN não configurado no servidor" };
  }
  if (token !== expected) return { ok: false, erro: "Token inválido" };
  return { ok: true };
}

const SLUG_REGEX = /^[a-z0-9]{2,40}$/;
const WHATSAPP_REGEX = /^55\d{10,11}$/;

export function validarSlug(
  input: unknown,
): { ok: true; slug: string } | { ok: false; erro: string } {
  const slug = String(input || "").trim().toLowerCase();
  if (!SLUG_REGEX.test(slug)) {
    return {
      ok: false,
      erro: "nome_empresa deve ter 2-40 caracteres minúsculos sem espaço",
    };
  }
  return { ok: true, slug };
}

export function validarWhatsapp(
  input: unknown,
): { ok: true; whatsapp: string | null } | { ok: false; erro: string } {
  const wpp = String(input || "").replace(/\D+/g, "");
  if (!wpp) return { ok: true, whatsapp: null };
  if (!WHATSAPP_REGEX.test(wpp)) {
    return {
      ok: false,
      erro: "vendedor_whatsapp inválido. Formato: 5531999999999",
    };
  }
  return { ok: true, whatsapp: wpp };
}

export function gerarSenhaAleatoria(): string {
  const alfabeto =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(32);
  let senha = "";
  for (let i = 0; i < 16; i++) {
    senha += alfabeto[bytes[i] % alfabeto.length];
  }
  return senha;
}
