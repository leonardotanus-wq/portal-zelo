import Link from "next/link";
import {
  BookOpen,
  Camera,
  FileText,
  Flame,
  Images,
  ShoppingCart,
  Wrench,
} from "lucide-react";

type Card = {
  href: string;
  external: boolean;
  title: string;
  descricao: string;
  Icon: typeof ShoppingCart;
  destaque?: boolean;
};

const cards: Card[] = [
  {
    href: "/orcamento",
    external: false,
    title: "Pedir Orçamento de Portão",
    descricao: "Envie medidas e detalhes pelo WhatsApp ao seu vendedor.",
    Icon: ShoppingCart,
  },
  {
    href: "/pecas",
    external: false,
    title: "Comprar Peças Avulsas",
    descricao: "Solicite peças de reposição rapidamente.",
    Icon: Wrench,
  },
  {
    href: "https://drive.google.com/drive/folders/1qTYa7tetecVeFzz3h3ou-olRAqvfeKrv?usp=sharing",
    external: true,
    title: "Vídeos e Fotos que estão Bombando!!!",
    descricao: "Os materiais que mais estão vendendo agora.",
    Icon: Flame,
    destaque: true,
  },
  {
    href: "https://drive.google.com/drive/folders/1eKgKLMz1m5wLjVqAfJOaY6FXaeQWCVbD?usp=drive_link",
    external: true,
    title: "Modelos de Proposta",
    descricao: "Modelos prontos para fechar com seu cliente.",
    Icon: FileText,
  },
  {
    href: "https://drive.google.com/drive/folders/1ZEpgGdtT2omZulp2bKdTwf2bhCAomkv1?usp=sharing",
    external: true,
    title: "Manuais e PDFs",
    descricao: "Documentação técnica e manuais oficiais.",
    Icon: BookOpen,
  },
  {
    href: "https://drive.google.com/drive/folders/1dJ8B2fPncH4Q0PU3lI99e2BAfQ4hSoGy?usp=drive_link",
    external: true,
    title: "Vídeos e Fotos Diversas",
    descricao: "Banco de imagens e vídeos para usar nas suas vendas.",
    Icon: Images,
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
        {cards.map(({ href, external, title, descricao, Icon, destaque }) => {
          const cardClass = `group relative flex flex-col gap-3 rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
            destaque
              ? "border-zelo-yellow ring-2 ring-zelo-yellow"
              : "border-zinc-200"
          }`;

          const inner = (
            <>
              {destaque && (
                <span className="absolute -top-3 right-4 rounded-full bg-zelo-yellow px-3 py-1 text-xs font-extrabold text-zelo-dark shadow-sm">
                  🔥 NOVO
                </span>
              )}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zelo-yellow/30 text-zelo-dark transition group-hover:bg-zelo-yellow">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-extrabold text-zelo-dark">{title}</h3>
              <p className="text-sm text-zinc-600">{descricao}</p>
            </>
          );

          if (external) {
            return (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                {inner}
              </a>
            );
          }

          return (
            <Link key={href} href={href} className={cardClass}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
