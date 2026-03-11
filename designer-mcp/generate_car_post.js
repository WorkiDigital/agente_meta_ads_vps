import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const imageModel = genAI.getGenerativeModel({ model: "imagen-4.0-fast-generate-001" });

const dbPath = path.join(__dirname, 'data.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

async function gerarSlidePremium(texto, promptImagem, pasta_destino, nome_arquivo) {
    try {
        console.log(`Gerando slide: ${nome_arquivo}...`);
        const result = await imageModel.generateContent({
            contents: [{ role: "user", parts: [{ text: promptImagem }] }],
            generationConfig: { responseModalities: ["IMAGE"] }
        });

        const part = result.response.candidates?.[0]?.content?.parts?.[0];
        let bgBuffer = null;

        if (part?.inlineData) {
            bgBuffer = Buffer.from(part.inlineData.data, "base64");
        }

        if (!bgBuffer) {
            console.error(`Erro: O Gemini não retornou uma imagem para ${nome_arquivo}.`);
            return;
        }

        const SLIDE_W = 1080;
        const SLIDE_H = 1080;

        const overlay = Buffer.from(
            `<svg width="${SLIDE_W}" height="${SLIDE_H}">
                <rect width="${SLIDE_W}" height="${SLIDE_H}" fill="rgba(0,0,0,0.58)"/>
            </svg>`
        );

        let textLines = texto.replace(/\\n/g, "\n").split("\n\n");
        
        let linhasSvg = "";
        let y = 300;
        const FONT_SIZE = 48;
        const LINE_HEIGHT = 64;

        for (const paragrafo of textLines) {
            const palavras = paragrafo.split(" ");
            let atual = "";
            for (const p of palavras) {
                if ((atual + " " + p).trim().length <= 25) {
                    atual = (atual + " " + p).trim();
                } else {
                    const escaped = atual.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    linhasSvg += `<text x="540" y="${y}" font-family="Arial Black, Arial" font-size="${FONT_SIZE}" fill="white" text-anchor="middle" font-weight="900">${escaped}</text>`;
                    y += LINE_HEIGHT;
                    atual = p;
                }
            }
            if (atual) {
                const escaped = atual.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                linhasSvg += `<text x="540" y="${y}" font-family="Arial Black, Arial" font-size="${FONT_SIZE}" fill="white" text-anchor="middle" font-weight="900">${escaped}</text>`;
                y += LINE_HEIGHT;
            }
            y += 20;
        }

        const BAR_Y = 920;
        const textSvg = Buffer.from(
            `<svg width="${SLIDE_W}" height="${SLIDE_H}" xmlns="http://www.w3.org/2000/svg">
                ${linhasSvg}
                <!-- Barra de assinatura -->
                <rect x="0" y="${BAR_Y}" width="${SLIDE_W}" height="160" fill="rgba(0,0,0,0.7)"/>
                <text x="540" y="${BAR_Y + 60}" font-family="Arial Black, Arial" font-size="34" fill="white" font-weight="900" text-anchor="middle">${db.profile.handle || '@hericksonmaia'}</text>
                <text x="540" y="${BAR_Y + 105}" font-family="Arial" font-size="26" fill="#cccccc" text-anchor="middle">${db.profile.profession || 'Estrategista Digital'}</text>
            </svg>`
        );

        const outPath = path.join(__dirname, 'posts', pasta_destino);
        if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });
        const finalPath = path.join(outPath, nome_arquivo);

        await sharp(bgBuffer)
            .resize(SLIDE_W, SLIDE_H, { fit: "cover" })
            .composite([
                { input: overlay },
                { input: textSvg }
            ])
            .jpeg({ quality: 95 })
            .toFile(finalPath);

        console.log(`Slide premium gerado com sucesso em: ${finalPath}`);
    } catch (err) {
        console.error(`Error processing slide ${nome_arquivo}:`, err);
    }
}

const slide = {
    texto: "A VELOCIDADE DA ESCALA\n\nPerformance não é sobre correr solto, mas sobre controle preciso.",
    promptImagem: "cinematic ultra-realistic photo of a sleek black sports car driving fast on an illuminated neon city street at night, capturing motion blur, 8k",
    nome_arquivo: "carro.jpg"
};

async function run() {
    const dataFolder = 'post_estatico/2026-03-09';
    console.log("Starting generation in", dataFolder);
    await gerarSlidePremium(slide.texto, slide.promptImagem, dataFolder, slide.nome_arquivo);
    console.log("Image generation finished.");
}

run();
