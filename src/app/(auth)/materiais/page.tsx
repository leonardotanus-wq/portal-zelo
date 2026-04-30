import { redirect } from "next/navigation";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  BookOpen,
} from "lucide-react";
import { getRevendaLogada } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageBackLink } from "@/components/page-back-link";
import { formatarDataCurta, formatarTamanho } from "@/lib/format";
import {
  CATEGORIAS_MATERIAL,
  type CategoriaMaterial,
  type Material,
} from "@/lib/types";
import { MateriaisTabs } from "./materiais-tabs";

export const metadata = { title: "Materiais — Zelo Portal" };

const ICONES: Record<CategoriaMaterial, typeof FileText> = {
  proposta: FileText,
  video: VideoIcon,
  foto: ImageIcon,
  manual: BookOpen,
};

function isCategoria(value: unknown): value is CategoriaMaterial {
  return (
    typeof value === "string" &&
    CATEGORIAS_MATERIAL.some((c) => c.value === value)
  );
}

export default async function MateriaisPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const revenda = await getRevendaLogada();
  if (!revenda) redirect("/");

  const params = await searchParams;
  const cat: CategoriaMaterial = isCategoria(params.cat) ? params.cat : "proposta";

  const supabase = await createClient();
  const { data } = await supabase
    .from("materiais")
    .select("*")
    .eq("categoria", cat)
    .order("created_at", { ascending: false });

  const materiais = (data ?? []) as Material[];
  const Icone = ICONES[cat];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div className="mb-6 space-y-3">
        <PageBackLink />
        <h1 className="text-3xl font-extrabold text-zelo-dark">Materiais</h1>
        <p className="text-zinc-600">
          Baixe modelos, vídeos, fotos e manuais para apoiar suas vendas.
        </p>
      </div>

      <div className="mb-6">
        <MateriaisTabs atual={cat} />
      </div>

      {materiais.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-zinc-500 ring-1 ring-zinc-200">
          📦 Em breve novos materiais aqui
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materiais.map((m) => {
            const ehImagem = m.categoria === "foto";
            return (
              <div
                key={m.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200"
              >
                <div className="relative flex aspect-video w-full items-center justify-center bg-zinc-100">
                  {ehImagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.arquivo_url}
                      alt={m.titulo}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icone className="h-14 w-14 text-zinc-400" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-base font-bold text-zelo-dark">
                    {m.titulo}
                  </h3>
                  {m.descricao && (
                    <p className="line-clamp-2 text-sm text-zinc-600">
                      {m.descricao}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{formatarTamanho(m.tamanho_bytes)}</span>
                    <span>{formatarDataCurta(m.created_at)}</span>
                  </div>
                  <a
                    href={m.arquivo_url}
                    target="_blank"
                    rel="noopener"
                    download
                    className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zelo-yellow font-bold text-zelo-dark transition hover:brightness-95"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
