import { unstable_cache } from "next/cache";

type MicrolinkResponse = {
  status?: string;
  data?: {
    image?: { url?: string } | null;
    logo?: { url?: string } | null;
  };
};

async function fetchNewsImage(url: string): Promise<string | null> {
  if (!url) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    const apiKey = process.env.MICROLINK_API_KEY;
    if (apiKey) headers["x-api-key"] = apiKey;

    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers,
    });

    if (!res.ok) return null;

    const json = (await res.json()) as MicrolinkResponse;
    const image = json?.data?.image?.url;
    if (typeof image === "string" && image) return image;

    const logo = json?.data?.logo?.url;
    if (typeof logo === "string" && logo) return logo;

    return null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[microlink] falha em", url, err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function getNewsImage(url: string): Promise<string | null> {
  return unstable_cache(
    async () => fetchNewsImage(url),
    ["microlink-image", url],
    {
      revalidate: 21600,
      tags: ["microlink"],
    },
  )();
}
