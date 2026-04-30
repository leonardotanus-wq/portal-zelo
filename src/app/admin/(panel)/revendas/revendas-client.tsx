"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import type { Revenda } from "@/lib/types";
import { atualizarRevenda, alternarAtivaRevenda } from "./actions";

type Props = { revendas: Revenda[] };

function NovaRevendaDialog({ onCriou }: { onCriou: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome_empresa: "",
    nome_responsavel: "",
    cidade: "",
    estado: "",
    vendedor_nome: "",
    vendedor_whatsapp: "",
  });

  function reset() {
    setForm({
      nome_empresa: "",
      nome_responsavel: "",
      cidade: "",
      estado: "",
      vendedor_nome: "",
      vendedor_whatsapp: "",
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/criar-revenda", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.erro || "Falha ao criar revenda.");
          return;
        }
        toast.success(
          `Revenda criada! Login: ${form.nome_empresa.toLowerCase()} / senha: ${form.nome_empresa.toLowerCase()}`,
        );
        reset();
        setOpen(false);
        onCriou();
      } catch (err) {
        console.error(err);
        toast.error("Erro de rede.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-zelo-yellow px-4 text-sm font-bold text-zelo-dark transition hover:brightness-95">
            <Plus className="h-4 w-4" />
            Nova Revenda
          </button>
        }
      />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Revenda</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_empresa">
              Nome da empresa (login + senha)
            </Label>
            <Input
              id="nome_empresa"
              required
              placeholder="ex: jkportoes"
              value={form.nome_empresa}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  nome_empresa: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, ""),
                }))
              }
            />
            <p className="text-xs text-zinc-500">
              Apenas letras minúsculas e números, sem espaços. Será usado como
              login e senha iniciais.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nome_responsavel">Responsável</Label>
              <Input
                id="nome_responsavel"
                value={form.nome_responsavel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome_responsavel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={form.cidade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cidade: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input
                id="estado"
                maxLength={2}
                value={form.estado}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estado: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendedor_nome">Vendedor</Label>
              <Input
                id="vendedor_nome"
                value={form.vendedor_nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendedor_nome: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendedor_whatsapp">
              WhatsApp do vendedor (5531999999999)
            </Label>
            <Input
              id="vendedor_whatsapp"
              value={form.vendedor_whatsapp}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  vendedor_whatsapp: e.target.value.replace(/\D+/g, ""),
                }))
              }
              placeholder="5531999999999"
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zelo-dark px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar revenda
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditarRevendaDialog({
  revenda,
  onSalvou,
}: {
  revenda: Revenda;
  onSalvou: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome_responsavel: revenda.nome_responsavel ?? "",
    cidade: revenda.cidade ?? "",
    estado: revenda.estado ?? "",
    vendedor_nome: revenda.vendedor_nome ?? "",
    vendedor_whatsapp: revenda.vendedor_whatsapp ?? "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await atualizarRevenda({
        id: revenda.id,
        nome_responsavel: form.nome_responsavel || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        vendedor_nome: form.vendedor_nome || null,
        vendedor_whatsapp: form.vendedor_whatsapp || null,
      });
      if (!res.ok) {
        toast.error(res.erro);
        return;
      }
      toast.success("Revenda atualizada.");
      setOpen(false);
      onSalvou();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold hover:bg-zinc-50">
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
        }
      />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Revenda — {revenda.nome_empresa}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={form.nome_responsavel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome_responsavel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cidade: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Estado (UF)</Label>
              <Input
                maxLength={2}
                value={form.estado}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estado: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Input
                value={form.vendedor_nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendedor_nome: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>WhatsApp do vendedor</Label>
            <Input
              value={form.vendedor_whatsapp}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  vendedor_whatsapp: e.target.value.replace(/\D+/g, ""),
                }))
              }
              placeholder="5531999999999"
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

export function RevendasClient({ revendas }: Props) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  async function toggle(id: string, ativa: boolean) {
    const res = await alternarAtivaRevenda(id, !ativa);
    if (!res.ok) {
      toast.error(res.erro);
      return;
    }
    toast.success(ativa ? "Revenda desativada." : "Revenda ativada.");
    refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zelo-dark">Revendas</h1>
          <p className="text-sm text-zinc-500">
            Cadastre, edite e ative/desative revendas.
          </p>
        </div>
        <NovaRevendaDialog onCriou={refresh} />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {revendas.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  Nenhuma revenda cadastrada ainda.
                </td>
              </tr>
            )}
            {revendas.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">
                  <div className="font-bold text-zelo-dark">
                    {r.nome_empresa}
                  </div>
                  {r.nome_responsavel && (
                    <div className="text-xs text-zinc-500">
                      {r.nome_responsavel}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {r.cidade ? `${r.cidade}${r.estado ? ` / ${r.estado}` : ""}` : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {r.vendedor_nome || "—"}
                  {r.vendedor_whatsapp && (
                    <div className="text-xs text-zinc-500">
                      {r.vendedor_whatsapp}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.ativa ? (
                    <Badge className="bg-green-100 text-green-700">Ativa</Badge>
                  ) : (
                    <Badge className="bg-zinc-200 text-zinc-700">
                      Desativada
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditarRevendaDialog revenda={r} onSalvou={refresh} />
                    <button
                      onClick={() => toggle(r.id, r.ativa)}
                      className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold hover:bg-zinc-50"
                    >
                      {r.ativa ? "Desativar" : "Ativar"}
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
