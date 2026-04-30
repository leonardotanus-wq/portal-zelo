"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  nomeEmpresa: string;
  vendedorWhatsapp: string | null;
};

const MATERIAIS = [
  { value: "Cabo de Aço", label: "Cabo de Aço" },
  { value: "Polímeros", label: "Polímeros" },
];

const CORES = [
  { value: "Preta", label: "Preta" },
  { value: "Branca", label: "Branca" },
  { value: "Outra", label: "Outra" },
];

export function OrcamentoForm({ nomeEmpresa, vendedorWhatsapp }: Props) {
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [material, setMaterial] = useState<string>("");
  const [cor, setCor] = useState<string>("");
  const [corOutra, setCorOutra] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!vendedorWhatsapp) {
      toast.error(
        "Sua revenda ainda não tem um vendedor cadastrado. Fale com a Zelo.",
      );
      return;
    }
    if (!largura || !altura) {
      toast.error("Preencha largura e altura.");
      return;
    }
    if (!material) {
      toast.error("Escolha o material.");
      return;
    }
    if (!cor) {
      toast.error("Escolha a cor.");
      return;
    }
    if (cor === "Outra" && !corOutra.trim()) {
      toast.error("Descreva a cor desejada.");
      return;
    }

    startTransition(() => {
      const corFinal = cor === "Outra" ? corOutra.trim() : cor;
      const obs = observacoes.trim()
        ? `\n📝 *Observações:* ${observacoes.trim()}`
        : "";
      const mensagem =
        `Olá! Sou da revenda *${nomeEmpresa}* e gostaria de um orçamento de portão:\n\n` +
        `📐 *Largura:* ${largura}m\n` +
        `📐 *Altura:* ${altura}m\n` +
        `🔧 *Material:* ${material}\n` +
        `🎨 *Cor:* ${corFinal}` +
        obs +
        `\n\nAguardo retorno, obrigado!`;
      const url = `https://wa.me/${vendedorWhatsapp}?text=${encodeURIComponent(
        mensagem,
      )}`;
      window.open(url, "_blank", "noopener");
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="largura" className="text-base font-semibold">
            Largura (metros)
          </Label>
          <Input
            id="largura"
            type="number"
            step="0.1"
            min="0.1"
            inputMode="decimal"
            required
            value={largura}
            onChange={(e) => setLargura(e.target.value)}
            placeholder="Ex: 3.5"
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="altura" className="text-base font-semibold">
            Altura (metros)
          </Label>
          <Input
            id="altura"
            type="number"
            step="0.1"
            min="0.1"
            inputMode="decimal"
            required
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            placeholder="Ex: 2.2"
            className="h-12 text-base"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Material</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MATERIAIS.map((m) => (
            <button
              type="button"
              key={m.value}
              onClick={() => setMaterial(m.value)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                material === m.value
                  ? "border-zelo-yellow bg-zelo-yellow/10 ring-2 ring-zelo-yellow/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="text-base font-bold text-zelo-dark">
                {m.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Cor</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CORES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => setCor(c.value)}
              className={`rounded-xl border-2 p-4 text-left transition ${
                cor === c.value
                  ? "border-zelo-yellow bg-zelo-yellow/10 ring-2 ring-zelo-yellow/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="text-base font-bold text-zelo-dark">
                {c.label}
              </div>
            </button>
          ))}
        </div>
        {cor === "Outra" && (
          <Input
            placeholder="Descreva a cor desejada"
            value={corOutra}
            onChange={(e) => setCorOutra(e.target.value)}
            className="h-12 text-base"
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes" className="text-base font-semibold">
          Observações (opcional)
        </Label>
        <Textarea
          id="observacoes"
          rows={4}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Detalhes que ajudem o vendedor a montar a proposta."
          className="text-base"
        />
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
