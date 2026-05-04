"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Flame,
  Images,
  ShoppingCart,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type Card = {
  href: string;
  external: boolean;
  slug: string;
  title: string;
  descricao: string;
  Icon: LucideIcon;
  destaque?: boolean;
};

const cards: Card[] = [
  {
    href: "/orcamento",
    external: false,
    slug: "orcamento",
    title: "Pedir Orçamento de Portão",
    descricao: "Envie medidas e detalhes pelo WhatsApp ao seu vendedor.",
    Icon: ShoppingCart,
  },
  {
    href: "/pecas",
    external: false,
    slug: "pecas",
    title: "Comprar Peças Avulsas",
    descricao: "Solicite peças de reposição rapidamente.",
    Icon: Wrench,
  },
  {
    href: "https://drive.google.com/drive/folders/1qTYa7tetecVeFzz3h3ou-olRAqvfeKrv?usp=sharing",
    external: true,
    slug: "videos_bombando",
    title: "Vídeos e Fotos que estão Bombando!!!",
    descricao: "Os materiais que mais estão vendendo agora.",
    Icon: Flame,
    destaque: true,
  },
  {
    href: "https://drive.google.com/drive/folders/1eKgKLMz1m5wLjVqAfJOaY6FXaeQWCVbD?usp=drive_link",
    external: true,
    slug: "modelos_proposta",
    title: "Modelos de Proposta",
    descricao: "Modelos prontos para fechar com seu cliente.",
    Icon: FileText,
  },
  {
    href: "https://drive.google.com/drive/folders/1ZEpgGdtT2omZulp2bKdTwf2bhCAomkv1?usp=sharing",
    external: true,
    slug: "manuais",
    title: "Manuais e PDFs",
    descricao: "Documentação técnica e manuais oficiais.",
    Icon: BookOpen,
  },
  {
    href: "https://drive.google.com/drive/folders/1dJ8B2fPncH4Q0PU3lI99e2BAfQ4hSoGy?usp=drive_link",
    external: true,
    slug: "videos_diversas",
    title: "Vídeos e Fotos Diversas",
    descricao: "Banco de imagens e vídeos para usar nas suas vendas.",
    Icon: Images,
  },
];

function trackClick(slug: string) {
  try {
    const payload = JSON.stringify({ detalhe: slug });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track-click", blob);
      return;
    }
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // tracking nunca quebra a navegação
  }
}

export function HomeCards() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ href, external, slug, title, descricao, Icon, destaque }) => {
        const cardClass = `group relative flex flex-col gap-3 rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer text-left ${
          destaque
            ? "border-zelo-yellow ring-2 ring-zelo-yellow"
            : "border-zinc-200"
        }`;

        const handleClick = (e: React.MouseEvent) => {
          // Permite Ctrl/Cmd-click abrir em nova aba sem nossa intervenção
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
          e.preventDefault();
          trackClick(slug);
          if (external) {
            window.open(href, "_blank", "noopener,noreferrer");
          } else {
            router.push(href);
          }
        };

        return (
          <a
            key={slug}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            onClick={handleClick}
            className={cardClass}
          >
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
          </a>
        );
      })}
    </div>
  );
}
