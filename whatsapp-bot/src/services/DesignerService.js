import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const PROFILE_PIC_PATH = path.join(__dirname, "..", "..", "fotos", "foto-1773008385-4.jpg");

// Função para quebrar texto em linhas para SVG
function wrapText(text, maxCharsPerLine) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
            currentLine = (currentLine + " " + word).trim();
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

export class DesignerService {
    constructor(basePath) {
        this.basePath = basePath || path.join(__dirname, "..", "..");
        this.brandPath = path.join(this.basePath, "data", "brand.json");
    }

    readBrand() {
        if (!fs.existsSync(this.brandPath)) return null;
        return JSON.parse(fs.readFileSync(this.brandPath, "utf8"));
    }

    async uploadBufferToSupabase(buffer, fileName) {
        const SUPABASE_URL = 'https://jgderqdwvyqfauxfwqsc.supabase.co';
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
        const BUCKET = 'instagram-media';
        const storagePath = `vps_archive/${Date.now()}_${fileName}`;

        try {
            const response = await axios.post(
                `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`,
                buffer,
                {
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY,
                        'Content-Type': 'image/jpeg',
                        'x-upsert': 'true'
                    }
                }
            );

            return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
        } catch (error) {
            console.error("Erro no upload Supabase:", error.message);
            return null;
        }
    }

    async gerarSlidePremium({ texto, promptImagem, pastaDestino, nomeArquivo }) {
        const brandData = this.readBrand();
        const profile = brandData.profile;
        // 1. Imagem ilustrativa gerada via SDK novo
        const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash-exp-image-generation",
            contents: [{ role: "user", parts: [{ text: promptImagem + " professional, cinematic lighting, 8k, highly detailed, no text, clean composition." }] }],
            config: { responseModalities: ["TEXT", "IMAGE"] }
        });

        let bgBuffer = null;
        if (result.candidates?.[0]?.content?.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData) {
                    bgBuffer = Buffer.from(part.inlineData.data, "base64");
                    break;
                }
            }
        }

        if (!bgBuffer) throw new Error("O Gemini não retornou uma imagem.");

        // 2. Dimensões do Card: 4:5 (1080x1350)
        const W = 1080;
        const H = 1350;

        // Base Branca / Off-white (padrão editorial)
        const baseBuffer = await sharp({
            create: {
                width: W,
                height: H,
                channels: 4,
                background: { r: 245, g: 245, b: 245, alpha: 1 } // #F5F5F5
            }
        }).png().toBuffer();

        // Quebra o texto vindo do JSON (Ex: "O petróleo pode chegar a US$120...\n\nE quase ninguém está falando...")
        const parts = texto.split("\n\n");
        const tituloBruto = parts[0] || "";
        const subtituloBruto = parts.slice(1).join("\n\n") || "";

        // Processa Título
        const tituloLinhas = wrapText(tituloBruto, 25);
        let currentY = 220;
        let svgTexts = "";

        for (const linha of tituloLinhas) {
            const escaped = linha.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            svgTexts += `<text x="80" y="${currentY}" font-family="Arial Black, sans-serif" font-size="64" fill="#1a1a1a" font-weight="900">${escaped}</text>`;
            currentY += 75;
        }

        // Processa Subtítulo
        currentY += 20;
        const subParagrafos = subtituloBruto.split('\n');
        for (const pg of subParagrafos) {
            if (!pg.trim()) continue;
            const subLinhas = wrapText(pg, 45);
            for (const linha of subLinhas) {
                const escaped = linha.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                svgTexts += `<text x="80" y="${currentY}" font-family="Arial, sans-serif" font-size="34" fill="#555555" font-weight="400">${escaped}</text>`;
                currentY += 45;
            }
            currentY += 15;
        }

        // 3. Processa a imagem do Gemini (Central) com cantos arredondados
        const imgW = 920;
        let imgH = 1350 - currentY - 260; // Dynamic height based on text size, leaving room for footer
        if (imgH > 700) imgH = 700; // max height
        if (imgH < 400) imgH = 400;

        const rectSvg = Buffer.from(
            `<svg><rect x="0" y="0" width="${imgW}" height="${imgH}" rx="32" ry="32"/></svg>`
        );

        const geminiRounded = await sharp(bgBuffer)
            .resize(imgW, imgH, { fit: "cover" })
            .composite([{ input: rectSvg, blend: "dest-in" }])
            .png()
            .toBuffer();

        const imgY = currentY + 40;

        // 4. Header & Rodapé SVG
        const headerFooterSvg = Buffer.from(`
            <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
                <!-- Header -->
                <text x="80" y="80" font-family="Arial, sans-serif" font-size="24" fill="#888888" font-weight="600">${profile.handle}</text>
                <text x="540" y="80" font-family="Arial, sans-serif" font-size="24" fill="#888888" font-weight="600" text-anchor="middle">IA para conteúdo</text>
                <text x="1000" y="80" font-family="Arial, sans-serif" font-size="24" fill="#888888" font-weight="600" text-anchor="end">Copyright © 2026</text>

                <!-- Dynamic Text -->
                ${svgTexts}

                <!-- Footer Text (Profile Name) -->
                <text x="190" y="1235" font-family="Arial, sans-serif" font-size="28" fill="#1a1a1a" font-weight="bold">Herickson Maia</text>
                <circle cx="420" cy="1226" r="10" fill="#2196F3"/>
                <path d="M415 1226 l4 4 l8 -8" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                
                <text x="190" y="1270" font-family="Arial, sans-serif" font-size="24" fill="#888888">${profile.handle}</text>

                <!-- Swipe Icon area -->
                <text x="930" y="1255" font-family="Arial, sans-serif" font-size="24" fill="#555555" text-anchor="end" font-weight="600">Arrasta para o lado</text>
                <circle cx="970" cy="1245" r="28" fill="#444444"/>
                <!-- simple arrow pattern -->
                <path d="M965 1235 l10 10 l-10 10" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `);

        // 5. Foto de Perfil Arredondada
        let profileCircle;
        if (fs.existsSync(PROFILE_PIC_PATH)) {
            const circleSvg = Buffer.from('<svg><circle cx="45" cy="45" r="45"/></svg>');
            profileCircle = await sharp(PROFILE_PIC_PATH)
                .resize(90, 90, { fit: "cover", position: "top" })
                .composite([{ input: circleSvg, blend: "dest-in" }])
                .png()
                .toBuffer();
        }

        // 6. Composição Final
        const outDir = path.join(this.basePath, "posts", pastaDestino);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const finalPath = path.join(outDir, nomeArquivo);

        const compostions = [
            { input: headerFooterSvg, top: 0, left: 0 },
            { input: geminiRounded, top: imgY, left: 80 }
        ];

        if (profileCircle) {
            compostions.push({ input: profileCircle, top: 1195, left: 80 });
        }

        const finalBuffer = await sharp(baseBuffer)
            .composite(compostions)
            .jpeg({ quality: 95 })
            .toBuffer();

        await sharp(finalBuffer).toFile(finalPath);
        
        // Upload para Supabase (Archive)
        const publicUrl = await this.uploadBufferToSupabase(finalBuffer, nomeArquivo);

        console.log(`✅ Slide salvo em: ${finalPath}`);
        if (publicUrl) console.log(`☁️  Backup em Supabase: ${publicUrl}`);
        
        return { localPath: finalPath, publicUrl };
    }
}
