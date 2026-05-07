// src/agents/discoveryAgent.ts
import axios from "axios";
import { groq } from "../lib/groq";

type DiscoveryBook = {
  title: string;
  author: string;
  reason: string;
};

function extractJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error("JSON bulunamadı: " + cleaned);
  }

  return cleaned.slice(first, last + 1);
}

async function searchDiscovery(query: string) {
  const res = await axios.post(
    "https://google.serper.dev/search",
    { q: query, gl: "tr", hl: "tr" },
    {
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
    },
  );

  return res.data.organic || [];
}

export async function discoveryAgent(params: {
  genre?: string;
  readerType?: string;
  mood?: string;
  value?: string;
  limit?: number;
}) {
  const { genre, readerType, mood, value, limit = 12 } = params;

  const searchQuery = [
    genre ? `${genre} türünde en bilinen kitaplar` : "",
    genre ? `${genre} türünde çok satan kitaplar` : "",
    genre ? `${genre} klasik kitap önerileri` : "",
    readerType ? `${readerType} okurlar için kitap önerileri` : "",
    mood ? `${mood} için kitap önerileri` : "",
    value ? `${value} sevenler için kitap önerileri` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const webResults = await searchDiscovery(
    searchQuery || "Türkiye'de popüler kitap önerileri",
  );

  const context = webResults
    .slice(0, 10)
    .map(
      (r: any, index: number) =>
        `[${index + 1}]
Title: ${r.title || ""}
Snippet: ${r.snippet || ""}
URL: ${r.link || ""}`,
    )
    .join("\n\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are a Turkish book discovery agent. Return ONLY valid JSON. Do not use markdown.",
      },
      {
        role: "user",
        content: `
Kullanıcıya kitap keşif önerileri üret.

Kullanıcı bilgileri:
- Tür: ${genre || "belirtilmedi"}
- Okur tipi: ${readerType || "belirtilmedi"}
- Mood: ${mood || "belirtilmedi"}
- Değer: ${value || "belirtilmedi"}

Web sonuçları:
${context || "Web sonucu yok."}

Kurallar:
- Türkiye'de bilinen, okurlar tarafından tanınan, popüler veya klasikleşmiş kitapları seç.
- Dergi, makale, katalog, akademik çalışma, film incelemesi, liste yazısı önerme.
- Sadece gerçek kitap/roman öner.
- Aynı kitabı tekrar etme.
- Yazar adı biliniyorsa mutlaka yaz.
- Türkçe karşılığı yaygın olan kitaplarda Türkçe adını kullanabilirsin.
- Maksimum ${limit} kitap döndür.
- Return ONLY JSON.

JSON formatı:

{
  "books": [
    {
      "title": "",
      "author": "",
      "reason": ""
    }
  ]
}
`,
      },
    ],
    temperature: 0.35,
  });

  const text = completion.choices[0]?.message?.content || "{}";
  const data = JSON.parse(extractJson(text));

  const books: DiscoveryBook[] = Array.isArray(data.books)
    ? data.books
        .filter((b: any) => b?.title)
        .slice(0, limit)
        .map((b: any) => ({
          title: String(b.title || "").trim(),
          author: String(b.author || "").trim(),
          reason: String(b.reason || "").trim(),
        }))
    : [];

  return {
    books,
    sources: webResults.slice(0, 5).map((r: any) => ({
      title: r.title || "",
      url: r.link || "",
    })),
  };
}