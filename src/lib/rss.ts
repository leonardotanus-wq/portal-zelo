import Parser from "rss-parser";
import { unstable_cache } from "next/cache";
import { ehImagemLixo, getNewsImage } from "@/lib/microlink";

export type Noticia = {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  image: string | null;
};

const FEEDS: { url: string; nome: string }[] = [
  {
    url: "https://news.google.com/rss/search?q=assalto+resid%C3%AAncia&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    nome: "Google News — Assalto Residência",
  },
  {
    url: "https://news.google.com/rss/search?q=arrombamento&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    nome: "Google News — Arrombamento",
  },
  {
    url: "https://news.google.com/rss/search?q=invas%C3%A3o+casa&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    nome: "Google News — Invasão de Casa",
  },
  {
    url: "https://news.google.com/rss/search?q=roubo+condom%C3%ADnio&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    nome: "Google News — Roubo em Condomínio",
  },
  {
    url: "https://agenciabrasil.ebc.com.br/rss/justica/feed.xml",
    nome: "Agência Brasil — Justiça",
  },
];

type CustomItem = {
  "media:content"?: { $?: { url?: string } } | { $?: { url?: string } }[];
  enclosure?: { url?: string };
  "imagem-destaque"?: string;
};

const parser: Parser<unknown, CustomItem> = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["imagem-destaque", "imagem-destaque"],
    ],
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; ZeloPortalBot/1.0; +https://zeloprotege.com.br)",
  },
});

const USER_AGENT =
  "Mozilla/5.0 (compatible; ZeloPortalBot/1.0; +https://portal.zeloprotege.com)";

const HOSTS_BLOQUEADOS_NA_RESOLUCAO =
  /(?:^|\.)google\.com$|(?:^|\.)googleusercontent\.com$|(?:^|\.)gstatic\.com$|(?:^|\.)youtube\.com$|(?:^|\.)youtu\.be$/i;

function ehGoogleNews(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "news.google.com" || host.endsWith(".news.google.com");
  } catch {
    return false;
  }
}

function resolverUrlAbsoluta(maybeRelative: string, base: string): string | null {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return null;
  }
}

async function resolverLinkReal(
  linkOriginal: string,
  signal: AbortSignal,
): Promise<string> {
  if (!ehGoogleNews(linkOriginal)) return linkOriginal;

  try {
    const res = await fetch(linkOriginal, {
      signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const finalUrl = res.url || linkOriginal;
    if (!ehGoogleNews(finalUrl)) return finalUrl;

    if (!res.ok) return linkOriginal;
    const html = await res.text();

    const canonical = html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    );
    if (canonical?.[1]) {
      const url = resolverUrlAbsoluta(canonical[1], finalUrl);
      if (url && !ehGoogleNews(url)) return url;
    }

    const meta = html.match(
      /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']\d+\s*;\s*url=([^"']+)["']/i,
    );
    if (meta?.[1]) {
      const url = resolverUrlAbsoluta(meta[1], finalUrl);
      if (url && !ehGoogleNews(url)) return url;
    }

    const aRegex = /<a\s[^>]*href=["'](https?:\/\/[^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = aRegex.exec(html)) !== null) {
      const candidato = m[1];
      try {
        const host = new URL(candidato).hostname.toLowerCase();
        if (!HOSTS_BLOQUEADOS_NA_RESOLUCAO.test(host)) {
          return candidato;
        }
      } catch {
        // continua tentando
      }
    }

    return linkOriginal;
  } catch {
    return linkOriginal;
  }
}

function limparHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function aceitarImagem(url: string | undefined | null): string | null {
  if (!url) return null;
  return ehImagemLixo(url) ? null : url;
}

function extrairImagem(item: Record<string, unknown>): string | null {
  const imagemDestaque = item["imagem-destaque"];
  if (typeof imagemDestaque === "string") {
    const ok = aceitarImagem(imagemDestaque);
    if (ok) return ok;
  }

  const mediaContent = item["media:content"] as
    | { $?: { url?: string } }
    | { $?: { url?: string } }[]
    | undefined;
  if (Array.isArray(mediaContent) && mediaContent[0]?.$?.url) {
    const ok = aceitarImagem(mediaContent[0].$.url);
    if (ok) return ok;
  }
  if (mediaContent && !Array.isArray(mediaContent) && mediaContent.$?.url) {
    const ok = aceitarImagem(mediaContent.$.url);
    if (ok) return ok;
  }
  const mediaThumb = item["media:thumbnail"] as
    | { $?: { url?: string } }
    | undefined;
  if (mediaThumb?.$?.url) {
    const ok = aceitarImagem(mediaThumb.$.url);
    if (ok) return ok;
  }

  const enclosure = item.enclosure as { url?: string } | undefined;
  if (enclosure?.url) {
    const ok = aceitarImagem(enclosure.url);
    if (ok) return ok;
  }

  const html = (item.content as string) || (item["content:encoded"] as string) ||
    (item.description as string) || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) {
    const ok = aceitarImagem(match[1]);
    if (ok) return ok;
  }

  return null;
}

function normalizarTitulo(titulo: string) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function buscarFeed(
  feedUrl: string,
  nome: string,
): Promise<Noticia[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return (feed.items || []).map((item) => {
      const rawItem = item as Record<string, unknown>;
      const link = (rawItem.link as string) || "";
      const id =
        (rawItem.guid as string) ||
        link ||
        `${nome}-${rawItem.title || Math.random()}`;
      return {
        id: String(id),
        title: limparHtml((rawItem.title as string) || ""),
        description: limparHtml(
          (rawItem.contentSnippet as string) ||
            (rawItem.description as string) ||
            "",
        ).slice(0, 280),
        link,
        pubDate:
          (rawItem.isoDate as string) ||
          (rawItem.pubDate as string) ||
          new Date().toISOString(),
        source: nome,
        image: extrairImagem(rawItem),
      } as Noticia;
    });
  } catch (err) {
    console.error(`[RSS] Falha em ${nome}:`, err);
    return [];
  }
}

async function resolverImagemPara(noticia: Noticia): Promise<string | null> {
  if (noticia.image) return noticia.image;
  if (!noticia.link) return null;

  let alvo = noticia.link;
  if (ehGoogleNews(alvo)) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      alvo = await resolverLinkReal(alvo, ctrl.signal);
    } finally {
      clearTimeout(timer);
    }
    if (ehGoogleNews(alvo)) return null;
  }

  return getNewsImage(alvo);
}

async function fetchNoticias(): Promise<Noticia[]> {
  const resultados = await Promise.allSettled(
    FEEDS.map((f) => buscarFeed(f.url, f.nome)),
  );

  const todas: Noticia[] = [];
  for (const r of resultados) {
    if (r.status === "fulfilled") todas.push(...r.value);
  }

  const vistos = new Set<string>();
  const unicos: Noticia[] = [];
  for (const n of todas) {
    const chave = normalizarTitulo(n.title);
    if (!chave || vistos.has(chave)) continue;
    vistos.add(chave);
    unicos.push(n);
  }

  unicos.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );

  const top = unicos.slice(0, 20);

  const imagens = await Promise.all(top.map((n) => resolverImagemPara(n)));
  top.forEach((n, i) => {
    n.image = imagens[i] ?? null;
  });

  return top;
}

export const getNoticias = unstable_cache(fetchNoticias, ["noticias-rss-v2"], {
  revalidate: 1800,
  tags: ["noticias"],
});
