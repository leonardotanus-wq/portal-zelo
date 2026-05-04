import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { normalizarWhatsapp } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const metadata = { title: "Engajamento — Admin Zelo" };

const BOTOES_LABEL: Record<string, string> = {
  orcamento: "Pedir Orçamento",
  pecas: "Comprar Peças",
  videos_bombando: "Vídeos Bombando",
  modelos_proposta: "Modelos de Proposta",
  manuais: "Manuais",
  videos_diversas: "Vídeos Diversas",
};

function inicioDoDia(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function relativo(iso: string | null): string {
  if (!iso) return "Nunca logou";
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
}

function diasAtras(iso: string | null): string {
  if (!iso) return "—";
  return formatDistanceToNowStrict(new Date(iso), { unit: "day", locale: ptBR });
}

type RevendaInfo = {
  id: string;
  nome_empresa: string;
  cidade: string | null;
  estado: string | null;
  vendedor_nome: string | null;
  vendedor_whatsapp: string | null;
  ultimo_login_at: string | null;
};

type EventoMin = {
  revenda_id: string | null;
  tipo: string;
  detalhe: string | null;
  created_at: string;
};

async function carregarDados() {
  const supabase = await createClient();
  const agora = new Date();
  const inicioHoje = inicioDoDia(agora).toISOString();
  const seteDiasAtras = new Date(agora.getTime() - 7 * 86400000).toISOString();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const quatorzeDiasAtras = new Date(agora.getTime() - 14 * 86400000).toISOString();

  const [
    loginsHoje,
    loginsSemana,
    revendasAtivas,
    revendas,
    eventosLoginSemana,
    eventosMes,
  ] = await Promise.all([
    supabase
      .from("eventos_revenda")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "login")
      .gte("created_at", inicioHoje),
    supabase
      .from("eventos_revenda")
      .select("id", { count: "exact", head: true })
      .eq("tipo", "login")
      .gte("created_at", seteDiasAtras),
    supabase
      .from("revendas")
      .select("id", { count: "exact", head: true })
      .eq("ativa", true)
      .gte("ultimo_login_at", seteDiasAtras),
    supabase
      .from("revendas")
      .select(
        "id, nome_empresa, cidade, estado, vendedor_nome, vendedor_whatsapp, ultimo_login_at, ativa",
      )
      .eq("ativa", true),
    supabase
      .from("eventos_revenda")
      .select("revenda_id, tipo, detalhe, created_at")
      .eq("tipo", "login")
      .gte("created_at", seteDiasAtras)
      .order("created_at", { ascending: false }),
    supabase
      .from("eventos_revenda")
      .select("revenda_id, tipo, detalhe, created_at")
      .gte("created_at", inicioMes),
  ]);

  const todasRevendas = (revendas.data ?? []) as (RevendaInfo & { ativa: boolean })[];
  const eventosLogin = (eventosLoginSemana.data ?? []) as EventoMin[];
  const eventosDoMes = (eventosMes.data ?? []) as EventoMin[];

  // Sumidas: ativa + (sem login OU último login antes de 14 dias)
  const sumidas = todasRevendas
    .filter((r) => !r.ultimo_login_at || r.ultimo_login_at < quatorzeDiasAtras)
    .sort((a, b) => {
      if (!a.ultimo_login_at && !b.ultimo_login_at) return 0;
      if (!a.ultimo_login_at) return -1;
      if (!b.ultimo_login_at) return 1;
      return a.ultimo_login_at.localeCompare(b.ultimo_login_at);
    });

  // Mapa rápido id → revenda
  const revendaPorId = new Map(todasRevendas.map((r) => [r.id, r]));

  // Logaram hoje / esta semana
  const logaramHoje = eventosLogin
    .filter((e) => e.created_at >= inicioHoje)
    .map((e) => ({
      revenda: e.revenda_id ? revendaPorId.get(e.revenda_id) : null,
      created_at: e.created_at,
    }))
    .filter((x) => x.revenda);

  const logaramSemana = eventosLogin
    .map((e) => ({
      revenda: e.revenda_id ? revendaPorId.get(e.revenda_id) : null,
      created_at: e.created_at,
    }))
    .filter((x) => x.revenda);

  // Ranking do mês — top 10 por logins (e total de cliques agregado)
  const statsPorRevenda = new Map<
    string,
    { logins: number; cliques: number }
  >();
  for (const e of eventosDoMes) {
    if (!e.revenda_id) continue;
    const cur = statsPorRevenda.get(e.revenda_id) ?? { logins: 0, cliques: 0 };
    if (e.tipo === "login") cur.logins++;
    if (e.tipo === "click_botao") cur.cliques++;
    statsPorRevenda.set(e.revenda_id, cur);
  }

  const ranking = Array.from(statsPorRevenda.entries())
    .map(([id, s]) => {
      const r = revendaPorId.get(id);
      return r
        ? {
            id,
            nome_empresa: r.nome_empresa,
            logins: s.logins,
            cliques: s.cliques,
            ultimo_login_at: r.ultimo_login_at,
          }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.logins - a.logins || b.cliques - a.cliques)
    .slice(0, 10);

  // Cliques nos botões (mês) — agregado por slug
  const cliquesPorBotao = new Map<string, number>();
  for (const e of eventosDoMes) {
    if (e.tipo !== "click_botao" || !e.detalhe) continue;
    cliquesPorBotao.set(
      e.detalhe,
      (cliquesPorBotao.get(e.detalhe) ?? 0) + 1,
    );
  }
  const cliquesArr = Object.keys(BOTOES_LABEL).map((slug) => ({
    slug,
    label: BOTOES_LABEL[slug],
    total: cliquesPorBotao.get(slug) ?? 0,
  }));
  const maxCliques = Math.max(1, ...cliquesArr.map((c) => c.total));

  return {
    kpis: {
      loginsHoje: loginsHoje.count ?? 0,
      loginsSemana: loginsSemana.count ?? 0,
      revendasAtivas: revendasAtivas.count ?? 0,
      revendasSumidas: sumidas.length,
    },
    ranking,
    logaramHoje,
    logaramSemana,
    sumidas,
    cliquesArr,
    maxCliques,
  };
}

function mensagemWhatsapp(
  nomeEmpresa: string,
  ultimoLoginIso: string | null,
): string {
  const tempo = ultimoLoginIso
    ? `há ${diasAtras(ultimoLoginIso)}`
    : "ainda não acessou";
  const texto = `Olá! A revenda ${nomeEmpresa} ${tempo === "ainda não acessou" ? "ainda não acessou" : `não acessa o portal Zelo ${tempo}`}. Vale uma ligadinha pra ver se está tudo bem.`;
  return encodeURIComponent(texto);
}

export default async function PaginaEngajamento() {
  const dados = await carregarDados();

  const cards = [
    {
      label: "Logins hoje",
      value: dados.kpis.loginsHoje,
      Icon: Clock,
      cor: "bg-yellow-50 text-yellow-700",
    },
    {
      label: "Logins esta semana",
      value: dados.kpis.loginsSemana,
      Icon: TrendingUp,
      cor: "bg-blue-50 text-blue-700",
    },
    {
      label: "Revendas ativas (7d)",
      value: dados.kpis.revendasAtivas,
      Icon: Activity,
      cor: "bg-green-50 text-green-700",
    },
    {
      label: "Revendas sumidas (14d+)",
      value: dados.kpis.revendasSumidas,
      Icon: AlertTriangle,
      cor: "bg-red-50 text-red-700",
      destaque: true,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-extrabold text-zelo-dark">
        Engajamento das revendas
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Quem está usando, quem sumiu, e o que mais clicam.
      </p>

      {/* KPIs */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, cor, destaque }) => (
          <div
            key={label}
            className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${
              destaque && value > 0
                ? "ring-red-300"
                : "ring-zinc-200"
            }`}
          >
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${cor}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div
              className={`text-3xl font-extrabold ${
                destaque && value > 0 ? "text-red-600" : "text-zelo-dark"
              }`}
            >
              {value}
            </div>
            <div className="text-sm text-zinc-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Ranking do mês */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-extrabold text-zelo-dark">
          🏆 Ranking do mês — Top 10
        </h2>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">Revenda</th>
                <th className="px-4 py-3 text-right font-semibold">Logins</th>
                <th className="px-4 py-3 text-right font-semibold">Cliques</th>
                <th className="px-4 py-3 text-left font-semibold">Último login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {dados.ranking.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                    Sem atividade neste mês ainda.
                  </td>
                </tr>
              ) : (
                dados.ranking.map((r, i) => (
                  <tr key={r.id} className="text-zinc-700">
                    <td className="px-4 py-3 font-bold text-zinc-400">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zelo-dark">
                      {r.nome_empresa}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {r.logins}
                    </td>
                    <td className="px-4 py-3 text-right">{r.cliques}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {relativo(r.ultimo_login_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Logaram hoje / semana */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-extrabold text-zelo-dark">
          <CalendarClock className="mr-2 inline h-5 w-5" />
          Quem logou
        </h2>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <Tabs defaultValue="hoje">
            <TabsList>
              <TabsTrigger value="hoje">
                Hoje ({dados.logaramHoje.length})
              </TabsTrigger>
              <TabsTrigger value="semana">
                Esta semana ({dados.logaramSemana.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="hoje" className="pt-4">
              <ListaLogins lista={dados.logaramHoje} vazio="Ninguém logou hoje ainda." />
            </TabsContent>
            <TabsContent value="semana" className="pt-4">
              <ListaLogins lista={dados.logaramSemana} vazio="Ninguém logou nos últimos 7 dias." />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Sumidas */}
      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-zelo-dark">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Revendas sumidas (14+ dias sem logar)
        </h2>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          {dados.sumidas.length === 0 ? (
            <p className="p-6 text-center text-zinc-400">
              🎉 Todas as revendas ativas estão acessando o portal!
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Revenda</th>
                  <th className="px-4 py-3 text-left font-semibold">Cidade</th>
                  <th className="px-4 py-3 text-left font-semibold">Vendedor</th>
                  <th className="px-4 py-3 text-left font-semibold">Último login</th>
                  <th className="px-4 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {dados.sumidas.map((r) => {
                  const wppNumero = r.vendedor_whatsapp
                    ? normalizarWhatsapp(r.vendedor_whatsapp)
                    : null;
                  const link = wppNumero
                    ? `https://wa.me/${wppNumero}?text=${mensagemWhatsapp(r.nome_empresa, r.ultimo_login_at)}`
                    : null;
                  return (
                    <tr key={r.id} className="text-zinc-700">
                      <td className="px-4 py-3 font-semibold text-zelo-dark">
                        {r.nome_empresa}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {r.cidade ?? "—"}
                        {r.estado ? `/${r.estado}` : ""}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {r.vendedor_nome ?? "—"}
                        {r.vendedor_whatsapp ? (
                          <span className="block text-xs text-zinc-400">
                            {r.vendedor_whatsapp}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {relativo(r.ultimo_login_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-yellow-500"
                          >
                            Avisar vendedor
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-400">
                            sem WhatsApp
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Cliques por botão (mês) */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-zelo-dark">
          📊 Cliques nos botões (mês atual)
        </h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <div className="space-y-3">
            {dados.cliquesArr.map((c) => {
              const pct = (c.total / dados.maxCliques) * 100;
              return (
                <div key={c.slug}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-zinc-700">
                      {c.label}
                    </span>
                    <span className="font-bold text-zelo-dark">{c.total}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all"
                      style={{ width: `${Math.max(pct, c.total > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function ListaLogins({
  lista,
  vazio,
}: {
  lista: { revenda: RevendaInfo | null | undefined; created_at: string }[];
  vazio: string;
}) {
  if (lista.length === 0) {
    return <p className="text-sm text-zinc-400">{vazio}</p>;
  }
  return (
    <ul className="divide-y divide-zinc-100">
      {lista.map((item, i) => (
        <li
          key={`${item.revenda?.id ?? "?"}-${i}`}
          className="flex items-center justify-between py-2.5 text-sm"
        >
          <span className="font-semibold text-zelo-dark">
            {item.revenda?.nome_empresa ?? "—"}
            {item.revenda?.cidade ? (
              <span className="ml-2 text-xs font-normal text-zinc-400">
                {item.revenda.cidade}
                {item.revenda.estado ? `/${item.revenda.estado}` : ""}
              </span>
            ) : null}
          </span>
          <span className="text-xs text-zinc-500">
            {relativo(item.created_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
