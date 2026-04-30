"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Check, DollarSign, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatarData } from "@/lib/format";
import type { StatusVideo, VideoInstalacao } from "@/lib/types";
import {
  atualizarObservacaoVideo,
  atualizarStatusVideo,
  gerarLinkDownloadVideo,
} from "./actions";

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

function ObservacaoInline({ video }: { video: VideoInstalacao }) {
  const [valor, setValor] = useState(video.observacao ?? "");
  const [pending, startTransition] = useTransition();

  function salvar() {
    if (valor === (video.observacao ?? "")) return;
    startTransition(async () => {
      const res = await atualizarObservacaoVideo({
        id: video.id,
        observacao: valor,
      });
      if (!res.ok) toast.error(res.erro);
      else toast.success("Observação salva.");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={salvar}
        placeholder="Observação"
        className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs"
      />
      {pending && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
    </div>
  );
}

export function VideosClient({ videos }: { videos: VideoInstalacao[] }) {
  const router = useRouter();

  async function baixar(arquivoPath: string) {
    const res = await gerarLinkDownloadVideo(arquivoPath);
    if (!res.ok) {
      toast.error(res.erro);
      return;
    }
    window.open(res.url, "_blank", "noopener");
  }

  async function mudarStatus(id: string, status: StatusVideo) {
    const res = await atualizarStatusVideo({ id, status });
    if (!res.ok) {
      toast.error(res.erro);
      return;
    }
    toast.success("Status atualizado.");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-zelo-dark">
          Vídeos de instalação
        </h1>
        <p className="text-sm text-zinc-500">
          Aprove e marque como pagos os vídeos enviados pelas revendas.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Revenda</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Arquivo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Observação</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  Nenhum vídeo enviado ainda.
                </td>
              </tr>
            )}
            {videos.map((v) => (
              <tr key={v.id} className="border-t border-zinc-100 align-top">
                <td className="px-4 py-3 font-bold text-zelo-dark">
                  {v.revenda?.nome_empresa ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                  {formatarData(v.created_at)}
                </td>
                <td className="px-4 py-3 text-zinc-600">{v.nome_arquivo}</td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE[v.status]}>
                    {STATUS_LABEL[v.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 w-64">
                  <ObservacaoInline video={v} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => baixar(v.arquivo_path)}
                      className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold hover:bg-zinc-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </button>
                    {v.status !== "aprovado" && v.status !== "pago" && (
                      <button
                        onClick={() => mudarStatus(v.id, "aprovado")}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aprovar
                      </button>
                    )}
                    {v.status !== "pago" && (
                      <button
                        onClick={() => mudarStatus(v.id, "pago")}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-green-200 bg-white px-3 text-xs font-semibold text-green-700 hover:bg-green-50"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        Marcar pago
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
