// @ts-ignore
// supabase/functions/book-recommendations/index.ts
// supabase/functions/book-recommendations/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
type SeedBook = {
  title: string;
  author: string;
  rating?: number;
  note?: string;
  categories?: string[];
  description?: string;
};

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { books } = await req.json();

    if (!Array.isArray(books) || books.length === 0) {
      return new Response(
        JSON.stringify({ error: "Kitap verisi bulunamadı." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const safeBooks: SeedBook[] = books.slice(0, 10).map((book) => ({
      title: String(book.title ?? ""),
      author: String(book.author ?? ""),
      rating: typeof book.rating === "number" ? book.rating : undefined,
      note: book.note ? String(book.note) : undefined,
      categories: Array.isArray(book.categories) ? book.categories : [],
      description: book.description
        ? String(book.description).slice(0, 500)
        : "",
    }));
// @ts-ignore
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY tanımlı değil." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const prompt = `
Sen ReadSphere adlı bir sosyal kitap uygulamasında çalışan kitap öneri asistanısın.

Kullanıcının okuduğu ve puanladığı kitaplar:
${JSON.stringify(safeBooks, null, 2)}

Görev:
Bu kullanıcının okuma zevkine göre 5 kitap öner.

Kurallar:
- Türkçe cevap ver.
- Kullanıcının yüksek puan verdiği kitaplara daha çok önem ver.
- Çok genel konuşma, her öneride neden uygun olduğunu açıkla.
- Sadece geçerli JSON döndür.
- Markdown kullanma.
- JSON dışında açıklama yazma.

JSON formatı:
{
  "recommendations": [
    {
      "id": "1",
      "title": "Kitap adı",
      "author": "Yazar adı",
      "reason": "Bu kitabı neden önerdiğini 1-2 cümleyle açıkla.",
      "matchScore": 90,
      "suggestedStatus": "want"
    }
  ]
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const aiJson = await aiRes.json();

    if (!aiRes.ok) {
      return new Response(JSON.stringify({ error: aiJson }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text =
      aiJson.output_text ||
      aiJson.output?.[0]?.content?.[0]?.text ||
      "";

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        recommendations: [
          {
            id: "fallback-1",
            title: "Benzer atmosferde bir roman",
            author: "AI önerisi",
            reason:
              "Okuma geçmişine göre akıcı, karakter odaklı ve benzer atmosferli kitaplar sana uygun olabilir.",
            matchScore: 80,
            suggestedStatus: "want",
          },
        ],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});