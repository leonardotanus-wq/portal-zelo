import { createClient } from "@/lib/supabase/server";
import type { VideoInstalacao } from "@/lib/types";
import { VideosClient } from "./videos-client";

export const metadata = { title: "Vídeos — Admin Zelo" };

export default async function AdminVideosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos_instalacao")
    .select("*, revenda:revendas(nome_empresa)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <VideosClient videos={(data ?? []) as VideoInstalacao[]} />
    </div>
  );
}
