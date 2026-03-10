import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const api = axios.create({
  baseURL: process.env.EVOLUTION_URL,
  headers: { apikey: process.env.EVOLUTION_API_KEY },
});

const prompt = process.argv[2] || "um cachorro voando";
const numero = process.argv[3];

if (!numero) {
  console.error("Uso: node gerar-enviar.mjs 'prompt' 'numero'");
  process.exit(1);
}

console.log(`🎨 Gerando imagem: "${prompt}"...`);

const resultado = await genAI.models.generateContent({
  model: "imagen-4.0-fast-generate-001",
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  config: { responseModalities: ["TEXT", "IMAGE"] },
});

let base64 = null;
for (const part of resultado.candidates[0].content.parts) {
  if (part.inlineData) { base64 = part.inlineData.data; break; }
}

if (!base64) {
  console.error("Gemini não retornou imagem.");
  process.exit(1);
}

console.log("🖼️ Imagem gerada! Enviando pelo WhatsApp...");

await api.post(`/message/sendMedia/${process.env.EVOLUTION_INSTANCE}`, {
  number: numero,
  mediatype: "image",
  mimetype: "image/png",
  caption: prompt,
  media: base64,
});

console.log("✅ Imagem enviada com sucesso!");
