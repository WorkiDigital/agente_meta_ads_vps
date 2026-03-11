import { GoogleGenAI } from "@google/genai";
import { writeFileSync } from "fs";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = process.argv[2] || "uma paisagem bonita";
const arquivo = process.argv[3] || "imagem-gerada.png";

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

const buffer = Buffer.from(base64, "base64");
writeFileSync(arquivo, buffer);
console.log(`✅ Imagem salva em: ${arquivo}`);
