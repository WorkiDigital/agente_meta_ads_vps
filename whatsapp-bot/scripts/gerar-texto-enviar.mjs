import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import sharp from "sharp";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const api = axios.create({
  baseURL: process.env.EVOLUTION_URL,
  headers: { apikey: process.env.EVOLUTION_API_KEY },
});

const prompt = process.argv[2];
const texto = process.argv[3];
const numero = process.argv[4];

console.log(`🎨 Gerando imagem...`);

const resultado = await genAI.models.generateContent({
  model: "gemini-2.0-flash-exp-image-generation",
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

console.log(`✏️ Adicionando texto: "${texto}"...`);

const imgBuffer = Buffer.from(base64, "base64");
const meta = await sharp(imgBuffer).metadata();
const W = meta.width;
const H = meta.height;

// SVG com o texto sobre a imagem
const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.7)"/>
    </filter>
  </defs>
  <text
    x="${W / 2}"
    y="90"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="52"
    font-weight="bold"
    fill="white"
    filter="url(#shadow)"
  >${texto}</text>
</svg>`;

const finalBuffer = await sharp(imgBuffer)
  .composite([{ input: Buffer.from(svgOverlay), blend: "over" }])
  .png()
  .toBuffer();

const finalBase64 = finalBuffer.toString("base64");

console.log(`📲 Enviando pelo WhatsApp para ${numero}...`);

await api.post(`/message/sendMedia/${process.env.EVOLUTION_INSTANCE}`, {
  number: numero,
  mediatype: "image",
  mimetype: "image/png",
  caption: texto,
  media: finalBase64,
});

console.log("✅ Imagem com texto enviada com sucesso!");
