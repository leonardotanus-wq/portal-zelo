import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Revenda } from "./types";

export type TipoEvento =
  | "login"
  | "page_view"
  | "click_botao"
  | "logout"
  | "upload_video";

export async function trackEvento(
  revenda: Pick<Revenda, "id">,
  tipo: TipoEvento,
  detalhe?: string,
) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const userAgent = headersList.get("user-agent");
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      null;

    await supabase.from("eventos_revenda").insert({
      revenda_id: revenda.id,
      tipo,
      detalhe: detalhe ?? null,
      user_agent: userAgent ?? null,
      ip,
    });

    if (tipo === "login") {
      await supabase.rpc("incrementar_total_logins", {
        revenda_id_param: revenda.id,
      });
    } else {
      await supabase
        .from("revendas")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", revenda.id);
    }
  } catch (err) {
    console.error("[tracking] Falha ao registrar evento:", err);
  }
}
