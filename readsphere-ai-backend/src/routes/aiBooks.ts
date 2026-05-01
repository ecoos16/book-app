import express from "express";
import multer from "multer";
import { bookResearchAgent } from "../agents/bookResearchAgent";
import { coverReaderAgent } from "../agents/coverReaderAgent";
import { groq } from "../lib/groq";
const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.get("/analyze-test", async (req, res) => {
  try {
    const data = await bookResearchAgent("Sefiller", "Victor Hugo");

    res.json({
      success: true,
      inputType: "text",
      coverGuess: null,
      data,
    });
  } catch (error) {
    console.log("ANALYZE TEST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "AI test hata verdi",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
router.post("/insight", async (req, res) => {
  try {
    const { title, author, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Kitap adı gerekli",
      });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a book analysis AI. Return ONLY JSON. No text.",
        },
        {
          role: "user",
          content: `
Kitap:
${title} - ${author || "unknown"}

Açıklama:
${description || "yok"}

Şu JSON'u üret:

{
  "summary": "daha akıcı ve iyi yazılmış özet",
  "themes": ["tema1","tema2"],
  "who_should_read": "kimler okumalı",
  "similar": ["kitap1","kitap2"]
}
`,
        },
      ],
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content || "{}";

    res.json({
      success: true,
      data: JSON.parse(text),
    });
  } catch (error) {
    console.log("AI INSIGHT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "AI analiz hatası",
    });
  }
});

router.post("/analyze", upload.single("cover"), async (req, res) => {
  try {
    const { title, author } = req.body;

    let coverGuess: any = null;

    if (req.file) {
      coverGuess = await coverReaderAgent(req.file.buffer, req.file.mimetype);
    }

    const warnings: string[] = [];

    if (coverGuess && coverGuess.confidence < 0.5) {
      warnings.push(
        "Kapaktan okunan bilgi düşük güvenli. Lütfen bulunan bilgileri kontrol et.",
      );
    }

    const finalTitle = title || coverGuess?.possible_title;
    const finalAuthor = author || coverGuess?.possible_author;

    if (!finalTitle) {
      return res.status(400).json({
        success: false,
        message:
          "Kitap adı bulunamadı. Lütfen kitap adı yaz veya daha net bir kapak görseli yükle.",
      });
    }

    const data = await bookResearchAgent(finalTitle, finalAuthor);

    const mergedData = {
      ...data,
      warnings: [...(data.warnings || []), ...warnings],
    };

    res.json({
      success: true,
      inputType: req.file ? "image" : "text",
      coverGuess,
      data: mergedData,
    });
  } catch (error) {
    console.log("ANALYZE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "AI hata verdi",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;