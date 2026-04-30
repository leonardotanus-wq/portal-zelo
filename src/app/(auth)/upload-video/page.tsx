import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { getRevendaLogada } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageBackLink } from "@/components/page-back-link";
import { Badge } from "@/components/ui/badge";
import { formatarData } from "@/lib/format";
import type { StatusVideo, VideoInstalacao } from "@/lib/types";
import { UploadVideoForm } from "./upload-video-form";

export const metadata = { title: "Enviar Vídeo de Instalação — Zelo Portal" };

const STATUS_LABEL: Record<StatusVideo, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  pago: "Pago",
};

const STATUS_BADGE: Record<StatusVideo, string> = {
  pendente: "bg-zinc-200 text-zinc-700",
  aprovado: "bg-blue-100 text-blue-700",
  pago: "bg-green-100 text-green-700",
};

export default async function UploadVideoPage() {
  const revenda = await getRevendaLogada();
  if (!revenda) redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("videos_instalacao")
    .select("*")
    .eq("revenda_id", revenda.id)
    .order("created_at", { ascending: false });

  const videos = (data ?? []) as VideoInstalacao[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-10">
      <div className="mb-6 space-y-3">
        <PageBackLink />
        <h1 className="text-3xl font-extrabold text-zelo-dark">
          Mandar vídeo da instalação
        </h1>
      </div>

      <div className="mb-8 flex flex-col items-center gap-3 rounded-2xl bg-zelo-yellow/20 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zelo-yellow text-zelo-dark">
          <Camera className="h-7 w-7" />
        </div>
        <p className="text-zelo-dark">
          Mande um vídeo da sua instalação Smart Gate e ganhe{" "}
          <span className="font-extrabold">R$ 50 de voucher</span> em peças de
          reposição.
          <br />
          Seu vendedor valida o vídeo e libera o voucher manualmente.
        </p>
      </div>

      <div className="mb-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 md:p-8">
        <UploadVideoForm revendaId={revenda.id} />
      </div>

      <h2 className="mb-3 text-xl font-extrabold text-zelo-dark">
        Seus vídeos enviados
      </h2>
      {videos.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-zinc-500 ring-1 ring-zinc-200">
          Você ainda não enviou nenhum vídeo.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className="border-t border-zinc-100">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                    {formatarData(v.created_at)}
                  </td>
                  <td className="px-4 py-3 text-zelo-dark">{v.nome_arquivo}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_BADGE[v.status]}>
                      {STATUS_LABEL[v.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
