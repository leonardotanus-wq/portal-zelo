"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import type { Noticia } from "@/lib/rss";

export function NoticiaCard({
  noticia,
  destaque = false,
}: {
  noticia: Noticia;
  destaque?: boolean;
}) {
  const [imgErro, setImgErro] = useState(false);
  const mostrarImagem = noticia.image && !imgErro;

  return (
    <a
      href={noticia.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-xl bg-zelo-dark text-white shadow-md transition duration-200 hover:scale-[1.02] hover:brightness-110 ${
        destaque ? "md:row-span-2" : ""
      }`}
    >
      {mostrarImagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={noticia.image!}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={() => setImgErro(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Newspaper
            className="h-20 w-20 text-zelo-yellow opacity-20"
            strokeWidth={1.2}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      <span className="absolute left-3 top-3 z-10 inline-flex max-w-[calc(100%-1.5rem)] truncate rounded-full bg-zelo-yellow px-3 py-1 text-xs font-semibold text-zelo-dark shadow-sm">
        {noticia.source}
      </span>

      <div className="relative z-10 flex flex-col gap-2 p-4 md:p-5">
        <h3
          className={`line-clamp-3 font-extrabold leading-tight text-white drop-shadow ${
            destaque ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
          }`}
        >
          {noticia.title}
        </h3>
        {noticia.description && (
          <p className="line-clamp-2 text-sm text-zinc-200/90">
            {noticia.description}
          </p>
        )}
      </div>
    </a>
  );
}
