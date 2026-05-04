import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { HomeCards } from "@/components/home-cards";
import { JornadaRevenda } from "@/components/jornada-revenda";
import { getRevendaLogada } from "@/lib/auth";

export default async function HomeRevenda() {
  const revenda = await getRevendaLogada();
  if (!revenda) redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <JornadaRevenda etapaAtual={revenda.etapa_jornada ?? 3} />

      <Link
        href="/upload-video"
        className="group mb-8 flex items-center gap-4 rounded-2xl bg-zelo-yellow p-6 text-zelo-dark shadow-sm transition hover:brightness-95 md:p-8"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zelo-dark/10">
          <Camera className="h-9 w-9" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold leading-tight md:text-2xl">
            📹 Mande vídeo da sua instalação
          </h2>
          <p className="text-sm font-medium md:text-base">
            Ganhe <span className="font-extrabold">R$ 50</span> em peças de
            reposição
          </p>
        </div>
      </Link>

      <h1 className="mb-4 text-2xl font-extrabold text-zelo-dark md:text-3xl">
        O que você precisa hoje?
      </h1>

      <HomeCards />
    </div>
  );
}
