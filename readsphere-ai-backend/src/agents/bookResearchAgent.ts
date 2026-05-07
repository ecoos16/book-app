//src/agents/bookResearchAgent.ts
import axios from "axios";
import { groq } from "../lib/groq";

function extractJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error("JSON bulunamadı: " + cleaned);
  }

  return cleaned.slice(first, last + 1);
}

async function searchBook(query: string) {
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

async function searchBookCover(query: string) {
  const res = await axios.post(
    "https://google.serper.dev/images",
    { q: `${query} kitap kapağı`, gl: "tr", hl: "tr" },
    {
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
    },
  );

  return (res.data.images || [])
    .slice(0, 8)
    .map((img: any) => ({
      title: img.title || "",
      imageUrl: img.imageUrl || img.thumbnailUrl || "",
      source: img.source || "",
    }))
    .filter((img: any) => img.imageUrl);
}

export async function bookResearchAgent(title: string, author?: string) {
  const queries = [
    `${title} ${author || ""} kitap yayınevi sayfa sayısı isbn`,
    `${title} ${author || ""} kitap konusu özeti karakterleri`,
    `${title} ${author || ""} kitap incelemesi konusu teması`,
    `${title} ${author || ""} kitap kapak yayınevi`,
  ];

  const allResults: any[] = [];

  for (const query of queries) {
    const results = await searchBook(query);
    allResults.push(...results.slice(0, 4));
  }

  const uniqueResults = allResults.filter(
    (item: any, index: number, self: any[]) =>
      item.link &&
      index === self.findIndex((r: any) => r.link === item.link),
  );

  const results = uniqueResults.slice(0, 10);
  const coverResults = await searchBookCover(`${title} ${author || ""}`);

  const context = results
    .map(
      (r: any, index: number) =>
        `[${index + 1}]
Title: ${r.title || ""}
Snippet: ${r.snippet || ""}
URL: ${r.link || ""}`,
    )
    .join("\n\n");

  const coverContext = coverResults
    .map(
      (r: any, index: number) =>
        `[${index + 1}]
Title: ${r.title}
Image URL: ${r.imageUrl}
Source: ${r.source}`,
    )
    .join("\n\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are a careful Book Research Agent. Extract structured book metadata from web search results. Return only valid JSON. Do not use markdown.",
      },
      {
        role: "user",
        content: `
User searched book:
Title: ${title}
Author: ${author || "unknown"}

Web search results:
${context || "No web results found."}

Cover image candidates:
${coverContext || "No cover candidates found."}

Rules:
- Use only the web search results above.
- Do not invent unsupported facts.
- Return Turkish values where appropriate.
- title and author must describe the actual book/work, not a website result.
- publisher must be only one real publishing house name.
- Do not put website names such as Kitapyurdu, D&R, Trendyol, Amazon, Goodreads or Wikipedia into publisher.
- page_count and published_year must be numbers. Use 0 if uncertain.
- language should be the book language if supported by sources. If uncertain, use "".
- categories must be short Turkish category names.
- isbn must be a real ISBN if visible in sources. If uncertain, use "".
- cover_url must be a direct image URL from cover candidates.
- Prefer image URLs from publisher, bookstore or reliable book sources.
- If cover_url is uncertain, choose the most relevant cover candidate.
- confidence must be between 0 and 1.
- sources must contain max 5 relevant URLs from the web search results.
- Add warnings if there are multiple editions, uncertain page count, uncertain publisher, weak source support, or if the summary is based on limited information.

Description rules:
- description must be written in natural Turkish.
- description must be based only on the web search results above.
- Do not invent plot details that are not supported by the sources.
- If sources are limited, write a cautious general description instead of pretending certainty.
- description must be 3-5 clear Turkish sentences.
- description must explain:
  1. kitabın ana konusu,
  2. ana karakter veya temel odak,
  3. temel çatışma / mesele,
  4. okura sunduğu tema.
- Do not use English words such as "famous", "plot", "theme".
- Do not write publisher advertisement language.
- Do not say "hayattan ders çıkarır" unless sources clearly support it.
- If the book has many editions, describe the work itself, not one specific edition.
- Do not leave description empty. If information is very limited, write: "Bu kitap hakkında kaynaklarda sınırlı bilgi bulunmuştur..." and explain what is known.

Return ONLY this JSON structure:

{
  "title": "",
  "author": "",
  "publisher": "",
  "description": "",
  "page_count": 0,
  "published_year": 0,
  "language": "",
  "categories": [],
  "isbn": "",
  "cover_url": "",
  "confidence": 0,
  "warnings": [],
  "sources": [
    {
      "title": "",
      "url": ""
    }
  ]
}
`,
      },
    ],
    temperature: 0.15,
  });

  const text = completion.choices[0]?.message?.content || "{}";

  console.log("SEARCH RESULTS:", results);
  console.log("COVER RESULTS:", coverResults);
  console.log("AI:", text);

  const data = JSON.parse(extractJson(text));

  if (!data.cover_url && coverResults.length > 0) {
    data.cover_url = coverResults[0].imageUrl;
  }

  if (Array.isArray(data.sources)) {
    data.sources = data.sources.slice(0, 5);
  } else {
    data.sources = [];
  }

  if (!Array.isArray(data.warnings)) {
    data.warnings = [];
  }

  if (!Array.isArray(data.categories)) {
    data.categories = [];
  }

  return data;
}