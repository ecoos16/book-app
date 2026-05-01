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
    `${title} ${author || ""} kitap özeti konusu`,
    `${title} ${author || ""} kitap kapak yayınevi`,
  ];

  const allResults = [];

  for (const query of queries) {
    const results = await searchBook(query);
    allResults.push(...results.slice(0, 4));
  }

  const uniqueResults = allResults.filter(
    (item: any, index: number, self: any[]) =>
      index === self.findIndex((r: any) => r.link === item.link),
  );

  const results = uniqueResults.slice(0, 8);
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
          "You are a Book Research Agent. Extract structured book metadata from web search results. Return only valid JSON.",
      },
      {
        role: "user",
        content: `
User searched book:
Title: ${title}
Author: ${author || "unknown"}

Web search results:
${context}

Cover image candidates:
${coverContext}

Rules:
- Use only the web search results above.
- Do not invent unsupported details.
- publisher must be only one real publishing house name.
- Do not put website names into publisher.
- page_count and published_year must be numbers.
- description must be a detailed Turkish book summary with 4-6 sentences.
- description must explain the plot, main character, conflict and theme.
- Do not leave description empty.
- cover_url must be a direct image URL from cover candidates.
- Prefer image URLs from publisher, bookstore or Goodreads-like sources.
- If cover_url is uncertain, choose the most relevant cover candidate.
- confidence must be between 0 and 1.
- sources must contain max 5 relevant URLs from the search results.
- Add warnings if there are multiple editions, uncertain page count, uncertain publisher or weak source support.
- Return ONLY raw JSON. No markdown.

Return this JSON structure:

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
    temperature: 0.2,
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
  }

  return data;
}