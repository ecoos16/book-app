import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY .env içinde yok.");
}

export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});