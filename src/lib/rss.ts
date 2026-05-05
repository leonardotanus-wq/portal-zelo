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

type FeedConfig = {
  url: string;
  nome: string;
  filtrarPorKeywords: boolean;
};

const FEEDS: FeedConfig[] = [
  {
    url: "https://g1.globo.com/rss/g1/sp/",
    nome: "G1 — São Paulo",
    filtrarPorKeywords: true,
  },
  {
    url: "https://g1.globo.com/rss/g1/rj/",
    nome: "G1 — Rio de Janeiro",
    filtrarPorKeywords: true,
  },
  {
    url: "https://g1.globo.com/rss/g1/mg/",
    nome: "G1 — Minas Gerais",
    filtrarPorKeywords: true,
  },
  {
    url: "https://www.metropoles.com/feed",
    nome: "Metrópoles",
    filtrarPorKeywords: true,
  },
  {
    url: "https://agenciabrasil.ebc.com.br/rss/justica/feed.xml",
    nome: "Agência Brasil — Justiça",
    filtrarPorKeywords: false,
  },
];

const KEYWORDS = [
  "assalto", "roubo", "arrombamento", "invasao", "latrocinio", "sequestro",
  "residencia", "residencial", "condominio", "seguranca", "ladrao", "ladroes",
  "furto", "bandido", "crime", "policia", "pm", "gcm",
  "preso", "presos", "prisao", "detido", "detida", "detidos",
  "suspeito", "suspeitos",
  "violencia", "violento", "violenta", "vitima", "ameaca",
  "baleado", "baleada", "disparo", "tiros", "armado", "armados",
  "fuga", "perseguicao", "droga", "drogas", "trafico", "traficante",
  "homicidio", "agressao", "espancado",
  "motel", "joalheria", "agencia bancaria", "comercio",
  "posto de combustivel", "mercado", "farmacia",
  "ronda", "batalhao", "delegacia", "bo", "boletim de ocorrencia",
];

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function casaKeyword(titulo: string): boolean {
  const t = normalizar(titulo);
  return KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(t));
}

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

async function buscarFeed(feed: FeedConfig): Promise<Noticia[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    const items = (parsed.items || []).map((item) => {
      const rawItem = item as Record<string, unknown>;
      const link = (rawItem.link as string) || "";
      const id =
        (rawItem.guid as string) ||
        link ||
        `${feed.nome}-${rawItem.title || Math.random()}`;
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
        source: feed.nome,
        image: extrairImagem(rawItem),
      } as Noticia;
    });

    if (feed.filtrarPorKeywords) {
      return items.filter((n) => casaKeyword(n.title));
    }
    return items;
  } catch (err) {
    console.error(`[RSS] Falha em ${feed.nome}:`, err);
    return [];
  }
}

async function fetchNoticias(): Promise<Noticia[]> {
  const resultados = await Promise.allSettled(FEEDS.map((f) => buscarFeed(f)));

  const todas: Noticia[] = [];
  for (const r of resultados) {
    if (r.status === "fulfilled") todas.push(...r.value);
  }

  const vistos = new Set<string>();
  const unicos: Noticia[] = [];
  for (const n of todas) {
    const chave = normalizar(n.title);
    if (!chave || vistos.has(chave)) continue;
    vistos.add(chave);
    unicos.push(n);
  }

  unicos.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );

  const top = unicos.slice(0, 20);

  const imagens = await Promise.all(
    top.map((n) =>
      n.image || !n.link ? Promise.resolve(n.image) : getNewsImage(n.link),
    ),
  );
  top.forEach((n, i) => {
    n.image = imagens[i] ?? null;
  });

  return top;
}

export const getNoticias = unstable_cache(fetchNoticias, ["noticias-rss-v3"], {
  revalidate: 1800,
  tags: ["noticias"],
});
