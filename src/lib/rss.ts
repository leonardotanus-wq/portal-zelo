import Parser from "rss-parser";
import { unstable_cache } from "next/cache";

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
};

const parser: Parser<unknown, CustomItem> = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
    ],
  },
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; ZeloPortalBot/1.0; +https://zeloprotege.com.br)",
  },
});

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

function extrairImagem(item: Record<string, unknown>): string | null {
  const mediaContent = item["media:content"] as
    | { $?: { url?: string } }
    | { $?: { url?: string } }[]
    | undefined;
  if (Array.isArray(mediaContent) && mediaContent[0]?.$?.url) {
    return mediaContent[0].$.url;
  }
  if (mediaContent && !Array.isArray(mediaContent) && mediaContent.$?.url) {
    return mediaContent.$.url;
  }
  const mediaThumb = item["media:thumbnail"] as
    | { $?: { url?: string } }
    | undefined;
  if (mediaThumb?.$?.url) return mediaThumb.$.url;

  const enclosure = item.enclosure as { url?: string } | undefined;
  if (enclosure?.url) return enclosure.url;

  const html = (item.content as string) || (item["content:encoded"] as string) ||
    (item.description as string) || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];

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

  const top = unicos.slice(0, 30);
  await preencherImagensFaltantes(top);
  return top;
}

async function preencherImagensFaltantes(noticias: Noticia[]): Promise<void> {
  const semImagem = noticias.filter((n) => !n.image && n.link);
  if (semImagem.length === 0) return;

  const resultados = await Promise.allSettled(
    semImagem.map((n) => buscarOgImageComTimeout(n.link, 3000)),
  );

  let sucesso = 0;
  semImagem.forEach((n, i) => {
    const r = resultados[i];
    if (r.status === "fulfilled" && r.value) {
      n.image = r.value;
      sucesso++;
    }
  });
  console.log(
    `[RSS] og:image — ${sucesso}/${semImagem.length} buscadas (${noticias.length} notícias no total)`,
  );
}

async function buscarOgImageComTimeout(
  url: string,
  timeoutMs: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZeloPortalBot/1.0; +https://portal.zeloprotege.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extrairOgImage(html, res.url || url);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extrairOgImage(html: string, baseUrl: string): string | null {
  const padroesOg = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  ];
  for (const p of padroesOg) {
    const m = html.match(p);
    if (m?.[1]) return resolverUrlAbsoluta(m[1], baseUrl);
  }
  const padroesTwitter = [
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];
  for (const p of padroesTwitter) {
    const m = html.match(p);
    if (m?.[1]) return resolverUrlAbsoluta(m[1], baseUrl);
  }
  const blocoArtigo = html.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i);
  if (blocoArtigo) {
    const imgMatch = blocoArtigo[2].match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) return resolverUrlAbsoluta(imgMatch[1], baseUrl);
  }
  return null;
}

function resolverUrlAbsoluta(maybeRelative: string, base: string): string | null {
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return null;
  }
}

export const getNoticias = unstable_cache(fetchNoticias, ["noticias-rss"], {
  revalidate: 1800,
  tags: ["noticias"],
});
