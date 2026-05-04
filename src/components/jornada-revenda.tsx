import { Check } from "lucide-react";
import { ETAPAS_JORNADA, TOTAL_ETAPAS } from "@/lib/jornada";

type Props = { etapaAtual: number };

export function JornadaRevenda({ etapaAtual }: Props) {
  const atual = Math.min(Math.max(etapaAtual, 1), TOTAL_ETAPAS);
  const concluida = atual === TOTAL_ETAPAS;
  const etapaInfo = ETAPAS_JORNADA[atual - 1];
  const proxima = ETAPAS_JORNADA[atual] ?? null;
  const progressoPct = (atual / TOTAL_ETAPAS) * 100;

  if (concluida) {
    return (
      <div className="mb-4 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200 md:p-5">
        <p className="text-center text-sm font-bold text-green-800 md:text-base">
          🎉 Parabéns! Jornada Zelo concluída
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 md:p-5">
      <div className="hidden sm:block">
        <div className="flex items-start">
          {ETAPAS_JORNADA.map((etapa, idx) => {
            const isConcluida = etapa.numero < atual;
            const isAtual = etapa.numero === atual;
            const isUltimaCol = idx === ETAPAS_JORNADA.length - 1;
            const linhaAtiva = etapa.numero < atual;
            return (
              <div key={etapa.numero} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <div className="flex flex-1 justify-end">
                    {idx > 0 && (
                      <div
                        className={`h-[3px] w-full ${
                          etapa.numero <= atual ? "bg-zelo-yellow" : "bg-zinc-200"
                        }`}
                      />
                    )}
                  </div>
                  <div
                    title={etapa.descricao}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isConcluida
                        ? "bg-zelo-yellow text-zelo-dark"
                        : isAtual
                        ? "animate-pulse bg-zelo-yellow text-zelo-dark ring-4 ring-zelo-yellow/30"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    {isConcluida ? <Check className="h-4 w-4" strokeWidth={3} /> : etapa.numero}
                  </div>
                  <div className="flex flex-1 justify-start">
                    {!isUltimaCol && (
                      <div
                        className={`h-[3px] w-full ${
                          linhaAtiva ? "bg-zelo-yellow" : "bg-zinc-200"
                        }`}
                      />
                    )}
                  </div>
                </div>
                <span
                  className={`mt-2 px-1 text-center text-[11px] leading-tight ${
                    isAtual
                      ? "font-bold text-zelo-dark"
                      : isConcluida
                      ? "text-zinc-700"
                      : "text-zinc-400"
                  }`}
                  title={etapa.descricao}
                >
                  {etapa.nome}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sm:hidden">
        <p className="text-sm text-zelo-dark">
          Sua jornada: <span className="font-bold">etapa {atual} de {TOTAL_ETAPAS}</span>
          {" — "}
          <span className="font-semibold">{etapaInfo.nome}</span>
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-zelo-yellow transition-all"
            style={{ width: `${progressoPct}%` }}
          />
        </div>
        {proxima && (
          <p className="mt-2 text-xs text-zinc-500">
            Próxima etapa: <span className="font-medium text-zinc-600">{proxima.nome}</span>
          </p>
        )}
      </div>
    </div>
  );
}
