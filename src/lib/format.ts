import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatarData(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatarDataCurta(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function formatarTamanho(bytes: number | null | undefined) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function normalizarWhatsapp(input: string) {
  return input.replace(/\D+/g, "");
}
