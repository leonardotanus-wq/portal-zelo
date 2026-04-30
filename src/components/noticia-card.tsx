"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import { formatarData } from "@/lib/format";
import type { Noticia } from "@/lib/rss";

export function NoticiaCard({ noticia }: { noticia: Noticia }) {
  const [imgErro, setImgErro] = useState(false);
  const mostrarImagem = noticia.image && !imgErro;

  return (
    <a
      href={noticia.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200 transition hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/9] w-full bg-zinc-100">
        {mostrarImagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={noticia.image!}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImgErro(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            <Newspaper className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex max-w-[80%] truncate rounded-full bg-zelo-dark/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {noticia.source}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-zelo-dark group-hover:text-zelo-dark/80">
          {noticia.title}
        </h3>
        {noticia.description && (
          <p className="line-clamp-3 text-sm text-zinc-600">
            {noticia.description}
          </p>
        )}
        <p className="mt-auto pt-2 text-xs text-zinc-500">
          {formatarData(noticia.pubDate)}
        </p>
      </div>
    </a>
  );
}
