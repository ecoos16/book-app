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

export async function coverReaderAgent(imageBuffer: Buffer, mimeType: string) {
  const base64Image = imageBuffer.toString("base64");
  const imageUrl = `data:${mimeType};base64,${base64Image}`;

  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content:
          "You are a Cover Reader Agent. Read visible text from book cover images. Return only valid JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
Look at this book cover image.

Task:
Extract visible book title and author.

Rules:
- Do not invent missing information.
- If title is not visible, use empty string.
- If author is not visible, use empty string.
- visible_text should contain important readable text from the cover.
- confidence must be between 0 and 1.
- Return ONLY raw JSON. No markdown.

Return this JSON:

{
  "possible_title": "",
  "possible_author": "",
  "visible_text": [],
  "confidence": 0
}
`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  const text = completion.choices[0]?.message?.content || "{}";
  console.log("COVER RAW:", text);

  return JSON.parse(extractJson(text));
}