import { redirect } from "next/navigation";
import { getRevendaLogada } from "@/lib/auth";
import { PageBackLink } from "@/components/page-back-link";
import { OrcamentoForm } from "./orcamento-form";

export const metadata = { title: "Orçamento de Portão — Zelo Portal" };

export default async function OrcamentoPage() {
  const revenda = await getRevendaLogada();
  if (!revenda) redirect("/");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-10">
      <div className="mb-6 space-y-3">
        <PageBackLink />
        <h1 className="text-3xl font-extrabold text-zelo-dark">
          Pedir Orçamento de Portão
        </h1>
        <p className="text-zinc-600">
          Preencha as medidas e detalhes que seu vendedor precisa para te enviar
          uma proposta no WhatsApp.
        </p>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 md:p-8">
        <OrcamentoForm
          nomeEmpresa={revenda.nome_empresa}
          vendedorWhatsapp={revenda.vendedor_whatsapp}
        />
      </div>
    </div>
  );
}
