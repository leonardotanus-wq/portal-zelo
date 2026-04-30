"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIAS_MATERIAL,
  type CategoriaMaterial,
  type Material,
} from "@/lib/types";
import { formatarDataCurta, formatarTamanho } from "@/lib/format";
import { registrarMaterial, deletarMaterial } from "./actions";

const TAMANHO_MAX_BYTES = 100 * 1024 * 1024;

function NovoMaterialDialog({ onCriou }: { onCriou: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] =
    useState<CategoriaMaterial>("proposta");
  const [arquivo, setArquivo] = useState<File | null>(null);

  function reset() {
    setTitulo("");
    setDescricao("");
    setCategoria("proposta");
    setArquivo(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) {
      toast.error("Selecione um arquivo.");
      return;
    }
    if (arquivo.size > TAMANHO_MAX_BYTES) {
      toast.error("Arquivo muito grande (máx 100 MB).");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const path = `${categoria}/${Date.now()}-${arquivo.name.replace(
        /\s+/g,
        "_",
      )}`;
      const { error: upErr } = await supabase.storage
        .from("materiais")
        .upload(path, arquivo, {
          cacheControl: "3600",
          upsert: false,
          contentType: arquivo.type || "application/octet-stream",
        });
      if (upErr) {
        toast.error(`Falha no upload: ${upErr.message}`);
        return;
      }
      const { data: pub } = supabase.storage
        .from("materiais")
        .getPublicUrl(path);

      const res = await registrarMaterial({
        titulo,
        descricao: descricao || null,
        categoria,
        arquivo_path: path,
        arquivo_url: pub.publicUrl,
        tamanho_bytes: arquivo.size,
      });
      if (!res.ok) {
        toast.error(res.erro);
        return;
      }
      toast.success("Material cadastrado.");
      reset();
      setOpen(false);
      onCriou();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-zelo-yellow px-4 text-sm font-bold text-zelo-dark transition hover:brightness-95">
            <Plus className="h-4 w-4" />
            Novo Material
          </button>
        }
      />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) =>
                setCategoria(e.target.value as CategoriaMaterial)
              }
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
            >
              {CATEGORIAS_MATERIAL.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivo (máx 100 MB)</Label>
            <Input
              id="arquivo"
              type="file"
              required
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zelo-dark px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MateriaisClient({ materiais }: { materiais: Material[] }) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  async function deletar(id: string) {
    if (!confirm("Tem certeza que deseja excluir este material?")) return;
    const res = await deletarMaterial(id);
    if (!res.ok) {
      toast.error(res.erro);
      return;
    }
    toast.success("Material excluído.");
    refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zelo-dark">Materiais</h1>
          <p className="text-sm text-zinc-500">
            Suba modelos, vídeos, fotos e manuais para as revendas baixarem.
          </p>
        </div>
        <NovoMaterialDialog onCriou={refresh} />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Tamanho</th>
              <th className="px-4 py-3">Cadastrado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {materiais.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  Nenhum material cadastrado ainda.
                </td>
              </tr>
            )}
            {materiais.map((m) => (
              <tr key={m.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <div className="font-bold text-zelo-dark">{m.titulo}</div>
                  {m.descricao && (
                    <div className="line-clamp-1 text-xs text-zinc-500">
                      {m.descricao}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-zinc-100 text-zinc-700">
                    {CATEGORIAS_MATERIAL.find((c) => c.value === m.categoria)
                      ?.label || m.categoria}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatarTamanho(m.tamanho_bytes)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatarDataCurta(m.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={m.arquivo_url}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold hover:bg-zinc-50"
                    >
                      Ver
                    </a>
                    <button
                      onClick={() => deletar(m.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
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
