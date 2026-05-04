import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getNoticias } from "@/lib/rss";
import { createClient } from "@/lib/supabase/server";
import { LoginRevendaForm } from "@/components/login-revenda-form";
import { NoticiaCard } from "@/components/noticia-card";

export const revalidate = 1800;

async function GridNoticias() {
  const noticias = await getNoticias();

  if (noticias.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-50 p-12 text-center text-zinc-500 ring-1 ring-zinc-200">
        Nenhuma notícia disponível no momento. Volte em alguns minutos.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-flow-dense md:auto-rows-[280px] md:grid-cols-2">
      {noticias.map((n, i) => (
        <NoticiaCard key={n.id} noticia={n} destaque={i === 0} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:auto-rows-[280px] md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`min-h-[280px] animate-pulse rounded-xl bg-zinc-200 ${
            i === 0 ? "md:row-span-2" : ""
          }`}
        />
      ))}
    </div>
  );
}

export default async function HomePublic() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (admin) redirect("/admin");
    redirect("/home");
  }

  return (
    <>
      <section className="bg-zelo-dark text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:items-center md:py-16">
          <div className="space-y-5">
            <span className="inline-block rounded-full bg-zelo-yellow/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zelo-yellow">
              Portal exclusivo das revendas
            </span>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              Notícias de Segurança em Tempo Real
            </h1>
            <p className="max-w-xl text-base text-zinc-300 md:text-lg">
              Acompanhe as últimas ocorrências e proteja seus clientes com Smart
              Gate.
            </p>
          </div>
          <div className="md:pl-4">
            <LoginRevendaForm />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-zelo-dark md:text-3xl">
              Últimas notícias
            </h2>
            <p className="text-sm text-zinc-500">
              Atualizado a cada 30 minutos a partir de fontes públicas.
            </p>
          </div>
        </div>
        <Suspense fallback={<GridSkeleton />}>
          <GridNoticias />
        </Suspense>
      </section>
    </>
  );
}
