import { Building2, FolderArchive, Video, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — Admin Zelo" };

async function getStats() {
  const supabase = await createClient();
  const [revendas, materiais, pendentes, aprovados] = await Promise.all([
    supabase
      .from("revendas")
      .select("id", { count: "exact", head: true })
      .eq("ativa", true),
    supabase.from("materiais").select("id", { count: "exact", head: true }),
    supabase
      .from("videos_instalacao")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase
      .from("videos_instalacao")
      .select("id", { count: "exact", head: true })
      .eq("status", "aprovado"),
  ]);

  return {
    revendas: revendas.count ?? 0,
    materiais: materiais.count ?? 0,
    pendentes: pendentes.count ?? 0,
    aprovados: aprovados.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      label: "Revendas ativas",
      value: stats.revendas,
      Icon: Building2,
      cor: "bg-yellow-50 text-yellow-700",
    },
    {
      label: "Materiais cadastrados",
      value: stats.materiais,
      Icon: FolderArchive,
      cor: "bg-blue-50 text-blue-700",
    },
    {
      label: "Vídeos pendentes",
      value: stats.pendentes,
      Icon: Video,
      cor: "bg-zinc-100 text-zinc-700",
    },
    {
      label: "Vídeos aprovados",
      value: stats.aprovados,
      Icon: CheckCircle2,
      cor: "bg-green-50 text-green-700",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-extrabold text-zelo-dark">Dashboard</h1>
      <p className="mb-8 text-sm text-zinc-500">
        Visão geral das revendas, materiais e vídeos enviados.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, cor }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
          >
            <div
              className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${cor}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-3xl font-extrabold text-zelo-dark">
              {value}
            </div>
            <div className="text-sm text-zinc-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
