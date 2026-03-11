import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SLIDE_W = 1080;
const SLIDE_H = 1080;
const PROFILE_PHOTO = "C:/Users/Samsung/evolution-mcp/fotos/foto-1773008491-0.jpg";

async function gerarImagem(prompt) {
  const resultado = await genAI.models.generateContent({
    model: "imagen-4.0-fast-generate-001",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  for (const part of resultado.candidates[0].content.parts) {
    if (part.inlineData) return Buffer.from(part.inlineData.data, "base64");
  }
  return null;
}

async function criarFotoCircular(fotoPath, tamanho) {
  const mascara = Buffer.from(
    `<svg><circle cx="${tamanho / 2}" cy="${tamanho / 2}" r="${tamanho / 2}"/></svg>`
  );
  return sharp(fotoPath)
    .resize(tamanho, tamanho, { fit: "cover", position: "top" })
    .composite([{ input: mascara, blend: "dest-in" }])
    .png()
    .toBuffer();
}

function quebrarTexto(texto, maxChars) {
  const palavras = texto.split(" ");
  const linhas = [];
  let atual = "";
  for (const palavra of palavras) {
    if ((atual + " " + palavra).trim().length <= maxChars) {
      atual = (atual + " " + palavra).trim();
    } else {
      if (atual) linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

async function criarSlide({ texto, promptImagem, outputPath }) {
  console.log("Gerando imagem de fundo com Gemini...");
  const bgBuffer = await gerarImagem(promptImagem);
  if (!bgBuffer) throw new Error("Falha ao gerar imagem de fundo");

  const bg = await sharp(bgBuffer)
    .resize(SLIDE_W, SLIDE_H, { fit: "cover" })
    .toBuffer();

  // Overlay escuro
  const overlay = Buffer.from(
    `<svg width="${SLIDE_W}" height="${SLIDE_H}">
      <rect width="${SLIDE_W}" height="${SLIDE_H}" fill="rgba(0,0,0,0.58)"/>
    </svg>`
  );

  // Texto do conteúdo
  const paragrafos = texto.split("\n\n");
  let linhasSvg = "";
  let y = 260;
  const FONT_SIZE = 44;
  const LINE_HEIGHT = 60;

  for (const paragrafo of paragrafos) {
    const linhas = quebrarTexto(paragrafo.replace(/\n/g, " "), 28);
    for (const linha of linhas) {
      const escapada = linha.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      linhasSvg += `<text x="540" y="${y}" font-family="Arial Black, Arial" font-size="${FONT_SIZE}" fill="white" text-anchor="middle" font-weight="900">${escapada}</text>`;
      y += LINE_HEIGHT;
    }
    y += 20; // espaço entre parágrafos
  }

  // Barra de assinatura
  const BAR_Y = 900;
  const CIRCLE_SIZE = 90;
  const CIRCLE_X = 80;
  const CIRCLE_CENTER_Y = BAR_Y + 70;

  const textSvg = Buffer.from(
    `<svg width="${SLIDE_W}" height="${SLIDE_H}" xmlns="http://www.w3.org/2000/svg">
      ${linhasSvg}
      <!-- Barra de assinatura -->
      <rect x="0" y="${BAR_Y}" width="${SLIDE_W}" height="180" fill="rgba(0,0,0,0.72)"/>
      <!-- Nome e cargo (posicionados após o círculo) -->
      <text x="200" y="${BAR_Y + 58}" font-family="Arial Black, Arial" font-size="32" fill="white" font-weight="900">@hericksonmaia ✓</text>
      <text x="200" y="${BAR_Y + 100}" font-family="Arial" font-size="26" fill="#cccccc">Estrategista em tráfego pago</text>
    </svg>`
  );

  console.log("Criando foto circular do perfil...");
  const fotoCircular = await criarFotoCircular(PROFILE_PHOTO, CIRCLE_SIZE);

  // Compor tudo
  await sharp(bg)
    .composite([
      { input: overlay },
      { input: textSvg },
      { input: fotoCircular, top: CIRCLE_CENTER_Y - CIRCLE_SIZE / 2, left: CIRCLE_X },
    ])
    .jpeg({ quality: 95 })
    .toFile(outputPath);

  console.log(`Slide salvo em: ${outputPath}`);
}

// ─── CONTEÚDO DO SLIDE ───────────────────────────────────────────────────────
const DATA = "2026-03-09";
const OUTPUT_DIR = `C:/Users/Samsung/Conteudos Herickson/carrosel/${DATA}`;

await criarSlide({
  texto: "Sam Altman anunciou um acordo entre a OpenAI e o Pentágono.\n\nIsso coloca a empresa no centro da implementação de IA dentro do governo dos EUA.",
  promptImagem:
    "cinematic dark photo: Pentagon building Washington DC at night with glowing AI neural network digital overlay, dark blue and gold tones, futuristic, ultra realistic, no text, no people, dramatic lighting",
  outputPath: path.join(OUTPUT_DIR, "slide-1.jpg"),
});
