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

const USER_AGENT =
  "Mozilla/5.0 (compatible; ZeloPortalBot/1.0; +https://portal.zeloprotege.com)";

const PADROES_LOGO = [
  /\blogo\b/i,
  /\bfavicon\b/i,
  /\bicon\b/i,
  /google\.com\/logos/i,
  /static\.googleusercontent\.com/i,
  /agenciabrasil\.ebc\.com\.br\/sites\/default\/files\/styles\/logo/i,
];

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

function ehProvavelLogo(url: string): boolean {
  return PADROES_LOGO.some((p) => p.test(url));
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
    // Se a cadeia de redirects já saiu do Google, esse é o artigo real
    if (!ehGoogleNews(finalUrl)) return finalUrl;

    if (!res.ok) return linkOriginal;
    const html = await res.text();

    // 1. <link rel="canonical">
    const canonical = html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    );
    if (canonical?.[1]) {
      const url = resolverUrlAbsoluta(canonical[1], finalUrl);
      if (url && !ehGoogleNews(url)) return url;
    }

    // 2. <meta http-equiv="refresh" content="0; url=...">
    const meta = html.match(
      /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']\d+\s*;\s*url=([^"']+)["']/i,
    );
    if (meta?.[1]) {
      const url = resolverUrlAbsoluta(meta[1], finalUrl);
      if (url && !ehGoogleNews(url)) return url;
    }

    // 3. Primeiro <a href="https://..."> que NÃO seja de domínios do Google/YouTube
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

async function tamanhoEhSuficiente(
  url: string,
  parentSignal: AbortSignal,
): Promise<boolean> {
  if (parentSignal.aborted) return false;

  const ctrl = new AbortController();
  const onParentAbort = () => ctrl.abort();
  parentSignal.addEventListener("abort", onParentAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), 1000);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return true; // servidor não suporta HEAD — dá benefício da dúvida
    const len = Number(res.headers.get("content-length") || "0");
    if (len > 0 && len < 5000) return false;
    return true;
  } catch {
    return true;
  } finally {
    clearTimeout(timer);
    parentSignal.removeEventListener("abort", onParentAbort);
  }
}

async function buscarOgImage(
  url: string,
  signal: AbortSignal,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extrairOgImage(html, res.url || url);
  } catch {
    return null;
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

type ResultadoImagem = {
  imagem: string | null;
  resolveuLinkReal: boolean;
  motivoFallback: "ok" | "sem-og" | "logo" | "muito-pequena" | "erro";
};

async function buscarImagemDaNoticia(
  linkOriginal: string,
  timeoutMs: number,
): Promise<ResultadoImagem> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let resolveuLinkReal = false;
  try {
    const linkReal = await resolverLinkReal(linkOriginal, controller.signal);
    resolveuLinkReal = linkReal !== linkOriginal;

    const url = await buscarOgImage(linkReal, controller.signal);
    if (!url) return { imagem: null, resolveuLinkReal, motivoFallback: "sem-og" };
    if (ehProvavelLogo(url))
      return { imagem: null, resolveuLinkReal, motivoFallback: "logo" };

    const ok = await tamanhoEhSuficiente(url, controller.signal);
    if (!ok)
      return { imagem: null, resolveuLinkReal, motivoFallback: "muito-pequena" };

    return { imagem: url, resolveuLinkReal, motivoFallback: "ok" };
  } catch {
    return { imagem: null, resolveuLinkReal, motivoFallback: "erro" };
  } finally {
    clearTimeout(timer);
  }
}

async function preencherImagensFaltantes(noticias: Noticia[]): Promise<void> {
  // Itens vindos do Google News quase sempre devolvem o logo do agregador como
  // og:image, mesmo após resolver o link real. Mais limpo deixar todas elas no
  // placeholder do que arriscar mostrar o logo errado.
  const candidatas = noticias.filter(
    (n) => !n.image && n.link && !ehGoogleNews(n.link),
  );
  const puladasGoogleNews = noticias.filter(
    (n) => !n.image && n.link && ehGoogleNews(n.link),
  ).length;

  if (candidatas.length === 0) {
    console.log(
      `[RSS] ${noticias.length} notícias — placeholder direto: ${puladasGoogleNews} (todas Google News)`,
    );
    return;
  }

  const resultados = await Promise.allSettled(
    candidatas.map((n) => buscarImagemDaNoticia(n.link, 5000)),
  );

  let resolvidos = 0;
  let comImagem = 0;
  let logoFiltrado = 0;
  let pequena = 0;
  let semOg = 0;
  let erro = 0;

  candidatas.forEach((n, i) => {
    const r = resultados[i];
    if (r.status !== "fulfilled") {
      erro++;
      return;
    }
    if (r.value.resolveuLinkReal) resolvidos++;
    if (r.value.imagem) {
      n.image = r.value.imagem;
      comImagem++;
      return;
    }
    switch (r.value.motivoFallback) {
      case "logo":
        logoFiltrado++;
        break;
      case "muito-pequena":
        pequena++;
        break;
      case "sem-og":
        semOg++;
        break;
      case "erro":
        erro++;
        break;
    }
  });

  const placeholderPorBusca = candidatas.length - comImagem;
  const placeholderTotal = placeholderPorBusca + puladasGoogleNews;
  console.log(
    `[RSS] ${noticias.length} notícias — Google News pulado: ${puladasGoogleNews} | tentativas: ${candidatas.length} (link real: ${resolvidos}, og válida: ${comImagem}) | placeholder total: ${placeholderTotal} (logo:${logoFiltrado}, pequena:${pequena}, sem-og:${semOg}, erro:${erro})`,
  );
}

export const getNoticias = unstable_cache(fetchNoticias, ["noticias-rss"], {
  revalidate: 1800,
  tags: ["noticias"],
});
