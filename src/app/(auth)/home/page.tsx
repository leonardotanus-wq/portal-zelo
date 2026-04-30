import Link from "next/link";
import {
  BookOpen,
  FileText,
  Image as ImageIcon,
  ShoppingCart,
  Video,
  Wrench,
  Camera,
} from "lucide-react";

const cards = [
  {
    href: "/orcamento",
    title: "Pedir Orçamento de Portão",
    descricao: "Envie medidas e detalhes pelo WhatsApp ao seu vendedor.",
    Icon: ShoppingCart,
  },
  {
    href: "/pecas",
    title: "Comprar Peças Avulsas",
    descricao: "Solicite peças de reposição rapidamente.",
    Icon: Wrench,
  },
  {
    href: "/materiais?cat=proposta",
    title: "Modelos de Proposta",
    descricao: "Modelos prontos para fechar com seu cliente.",
    Icon: FileText,
  },
  {
    href: "/materiais?cat=video",
    title: "Vídeos do Smart Gate",
    descricao: "Apresentações e tutoriais em vídeo.",
    Icon: Video,
  },
  {
    href: "/materiais?cat=foto",
    title: "Fotos do Smart Gate",
    descricao: "Banco de imagens para usar nas suas vendas.",
    Icon: ImageIcon,
  },
  {
    href: "/materiais?cat=manual",
    title: "Manuais e PDFs",
    descricao: "Documentação técnica e manuais oficiais.",
    Icon: BookOpen,
  },
];

export default function HomeRevenda() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, title, descricao, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zelo-yellow/30 text-zelo-dark transition group-hover:bg-zelo-yellow">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-extrabold text-zelo-dark">{title}</h3>
            <p className="text-sm text-zinc-600">{descricao}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
