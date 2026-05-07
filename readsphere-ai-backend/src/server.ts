//src/server.ts
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import aiBooksRouter from "./routes/aiBooks";
import discoveryRouter from "./routes/discovery";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ai-books", aiBooksRouter);
app.use("/api/discovery", discoveryRouter);
// test endpoint
app.get("/", (req, res) => {
  res.send("AI Backend çalışıyor 🚀");
});

const PORT = process.env.PORT || 3001;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});