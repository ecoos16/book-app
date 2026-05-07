// src/routes/discovery.ts
import express from "express";
import { discoveryAgent } from "../agents/discoveryAgent";

const router = express.Router();

router.post("/recommend", async (req, res) => {
  try {
    const { genre, readerType, mood, value, limit } = req.body;

    const data = await discoveryAgent({
      genre,
      readerType,
      mood,
      value,
      limit: typeof limit === "number" ? limit : 12,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.log("DISCOVERY RECOMMEND ERROR:", error);

    res.status(500).json({
      success: false,
      message: "AI keşif önerisi oluşturulamadı.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;