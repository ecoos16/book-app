import { ai } from "../lib/gemini";

function cleanJson(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export async function verificationAgent(data: any, input: any) {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",

    contents: `
You are a Verification Agent.

User input:
${JSON.stringify(input, null, 2)}

Book data:
${JSON.stringify(data, null, 2)}

Task:
Check if this data belongs to the same book.

Rules:
- Compare title and author
- Check consistency of year, pages, publisher
- Detect contradictions
- Detect multiple editions confusion

Update:
- Set confidence between 0 and 1
- Add warnings if needed
- Remove clearly incorrect fields
- Keep correct ones

Return ONLY JSON with same structure.
`,
  });

  const text = cleanJson(result.text || "{}");

  return JSON.parse(text);
}