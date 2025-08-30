import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ Allow requests from frontend (http://localhost:5173)
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/compliance-chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    // 🔹 Turn all messages into a readable transcript
    const history = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join("\n");

    const prompt = `You are a compliance advisor for developers. 
                    Answer queries about geo-specific laws, risks, and obligations 
                    (e.g. GDPR, HIPAA, PDPA, CCPA). Provide references, possible risks, 
                    and suggested next actions, but remind users that final compliance 
                    decisions are theirs.

                    Conversation so far:
                    ${history}

                    Now respond to the latest user message.`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      reply: "⚠️ Error connecting to compliance advisor. Please try again later.",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);