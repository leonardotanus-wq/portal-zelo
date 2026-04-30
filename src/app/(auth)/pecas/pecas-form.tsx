"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  nomeEmpresa: string;
  vendedorWhatsapp: string | null;
};

const URGENCIAS = [
  { value: "Normal", label: "Normal" },
  { value: "Urgente", label: "Urgente" },
];

export function PecasForm({ nomeEmpresa, vendedorWhatsapp }: Props) {
  const [descricao, setDescricao] = useState("");
  const [urgencia, setUrgencia] = useState("Normal");
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!vendedorWhatsapp) {
      toast.error(
        "Sua revenda ainda não tem um vendedor cadastrado. Fale com a Zelo.",
      );
      return;
    }
    if (!descricao.trim()) {
      toast.error("Descreva a peça que você precisa.");
      return;
    }

    startTransition(() => {
      const mensagem =
        `Olá! Sou da revenda *${nomeEmpresa}* e preciso de peças avulsas:\n\n` +
        `📦 ${descricao.trim()}\n` +
        `⏱️ *Urgência:* ${urgencia}\n\n` +
        `Aguardo retorno, obrigado!`;
      const url = `https://wa.me/${vendedorWhatsapp}?text=${encodeURIComponent(
        mensagem,
      )}`;
      window.open(url, "_blank", "noopener");
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="descricao" className="text-base font-semibold">
          Descrição da peça
        </Label>
        <Textarea
          id="descricao"
          rows={6}
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva a peça que precisa, modelo do equipamento, quantidade, marca…"
          className="text-base"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Urgência</Label>
        <div className="grid grid-cols-2 gap-3">
          {URGENCIAS.map((u) => (
            <button
              type="button"
              key={u.value}
              onClick={() => setUrgencia(u.value)}
              className={`rounded-xl border-2 p-4 text-center transition ${
                urgencia === u.value
                  ? "border-zelo-yellow bg-zelo-yellow/10 ring-2 ring-zelo-yellow/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="text-base font-bold text-zelo-dark">
                {u.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-zelo-yellow text-base font-extrabold text-zelo-dark shadow-md transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        Enviar via WhatsApp
      </button>
    </form>
  );
}
