import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// (Removida inicialização global para evitar erro de env)

function wrapText(text, maxCharsX) {
    const lines = [];
    const words = text.split(" ");
    let curr = "";
    for (const w of words) {
        if ((curr + " " + w).trim().length <= maxCharsX) {
            curr = (curr + " " + w).trim();
        } else {
            lines.push(curr);
            curr = w;
        }
    }
    if (curr) lines.push(curr);
    return lines;
}

export class DesignerService {
    constructor(basePath) {
        this.basePath = basePath;
        this.moldurasIndex = 0; 
    }

    readBrand() {
        const bp = path.join(this.basePath, "data", "brand.json");
        return fs.existsSync(bp) ? JSON.parse(fs.readFileSync(bp, "utf8")) : { profile: { handle: "@user", profession: "" } };
    }

    async uploadToSupabase(buffer, nomeArquivo, pastaDestino) {
        const { default: axios } = await import("axios");
        const SUPABASE_URL = process.env.SUPABASE_URL || "https://jgderqdwvyqfauxfwqsc.supabase.co";
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
        const BUCKET = "instagram-media";
        if (!SUPABASE_KEY) return null;
        try {
            const ext = path.extname(nomeArquivo).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            const storagePath = `${pastaDestino}/${Date.now()}_${nomeArquivo}`;
            await axios.put(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, buffer, {
                headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Content-Type': mimeType, 'x-upsert': 'true' }
            });
            return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
        } catch (error) { return null; }
    }

    async gerarSlidePremium({ texto, promptImagem, pastaDestino, nomeArquivo, caminhoImagemLocal = null, eCapa = false, modelo = "02" }) {
        if (!nomeArquivo) throw new Error("nomeArquivo obrigatório.");
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
        const W = 1080; const H = 1350; const PAD = 80;
        const brand = this.readBrand();

        let bgBuffer = null;
        if (caminhoImagemLocal && fs.existsSync(caminhoImagemLocal)) {
            bgBuffer = fs.readFileSync(caminhoImagemLocal);
        } else if (promptImagem) {
            try {
                const res = await genAI.models.generateImages({
                    model: "imagen-4.0-fast-generate-001",
                    prompt: promptImagem + " cinematic, highly detailed, photorealistic, 8k, no text",
                    config: { numberOfImages: 1, aspectRatio: "4:3" }
                });
                const imgs = res.generatedImages || [];
                if (imgs.length > 0 && imgs[0].image?.imageBytes) {
                    bgBuffer = Buffer.from(imgs[0].image.imageBytes, "base64");
                }
            } catch (e) { console.error(`❌ Imagen ERRO:`, e.message); }
        }
        if (!bgBuffer) bgBuffer = await sharp({ create: { width: 400, height: 400, channels: 4, background: {r: 50, g:50, b:70, alpha:1} } }).png().toBuffer();

        // --- PREPARAÇÃO DO PERFIL ---
        const profPic = path.join(this.basePath, "fotos", "foto-1773008385-4.jpg");
        let avatarBaseSVG = `<circle cx="120" cy="90" r="40" fill="#333" />`;
        if (fs.existsSync(profPic)) {
            const av = fs.readFileSync(profPic).toString("base64");
            avatarBaseSVG = `<defs><clipPath id="avatarClip"><circle cx="120" cy="90" r="40" /></clipPath></defs><image href="data:image/jpeg;base64,${av}" x="80" y="50" width="80" height="80" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />`;
        }
        
        const headerSVG = `
            ${avatarBaseSVG}
            <text x="180" y="85" font-family="Arial Black, sans-serif" font-size="28" fill="#111" font-weight="900">${process.env.NOME || "Herickson Maia"}</text>
            <text x="180" y="115" font-family="Arial, sans-serif" font-size="22" fill="#666">${brand.profile.handle || "@hericksonmaia"}</text>
        `;
        const avatarSVG_Bottom = avatarBaseSVG.replace('y="50"', `y="${H - 140}"`).replace('cy="90"', `cy="${H - 100}"`);

        // --- LÓGICA DE TEXTO ---
        const textoLivre = texto.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2700}-\u{27BF}]/gu, '');
        const parts = textoLivre.split("\n\n");
        let tituloStr = parts[0] || "";
        let corpoStr = parts.slice(1).join("\n\n") || "";

        const drawText = (txt, isTitle, yStart, boxH, fontSize) => {
            if (!txt) return "";
            let localSVG = "";
            const sz = fontSize || (isTitle ? 62 : 36);
            let currY = yStart + sz;
            const wX = isTitle ? 32 : 45;
            const color = isTitle ? "#111" : "#555";
            const font = 'font-family="' + (isTitle ? 'Arial Black, sans-serif" font-weight="900"' : 'Arial, sans-serif"');
            for (const pg of txt.split("\n")) {
                if(!pg.trim()) { currY += sz; continue; }
                for (const l of wrapText(pg, wX)) {
                    if (currY - yStart > boxH) break;
                    const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    localSVG += `<text x="${PAD}" y="${currY}" ${font} font-size="${sz}" fill="${color}" text-anchor="start">${escaped}</text>`;
                    currY += sz * 1.25;
                }
                currY += sz * 0.5;
            }
            return localSVG;
        }

        let finalBuffer = null;

        if (modelo === "01") {
            // MODELO 01: IMAGEM FUNDO TOTAL + TEXTO POR CIMA
            const bgFull = await sharp(bgBuffer).resize(W, H, { fit: "cover" }).toBuffer();
            const overlay = Buffer.from(`<svg width="${W}" height="${H}">
                <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.4)"/>
                ${headerSVG.replace(/fill="#111"/g, 'fill="#fff"').replace(/fill="#666"/g, 'fill="#ccc"').replace(/fill="#333"/g, 'fill="#fff"')}
                ${drawText(tituloStr, true, 300, 400, 72).replace(/fill="#111"/g, 'fill="#fff"')}
                ${drawText(corpoStr, false, 750, 400, 42).replace(/fill="#555"/g, 'fill="#eee"')}
            </svg>`);
            finalBuffer = await sharp(bgFull).composite([{ input: overlay }]).jpeg({ quality: 95 }).toBuffer();
        } 
        else if (modelo === "03") {
            // MODELO 03: MOLDURAS FIXAS (BAIXO, MEIO, CIMA)
            const styleIdx = this.moldurasIndex % 3;
            this.moldurasIndex++;
            const moldurasFiles = ["baixo.png", "meio.png", "cima.png"];
            const molduraPath = path.join(this.basePath, "assets", "molduras", moldurasFiles[styleIdx]);
            
            // Coordenadas aproximadas do retângulo cinza (X=59, W=701)
            const boxes = [
                { x: 59, y: 317, w: 701, h: 640 }, // Baixo
                { x: 59, y: 66, w: 701, h: 875 },  // Meio
                { x: 59, y: 66, w: 701, h: 511 }   // Cima
            ];
            const box = boxes[styleIdx];

            const art = await sharp(bgBuffer).resize(box.w, box.h, { fit: "cover" })
                .composite([{ input: Buffer.from(`<svg><rect width="${box.w}" height="${box.h}" rx="35" ry="35" fill="#fff"/></svg>`), blend: 'dest-in' }])
                .png().toBuffer();

            const textSVG = Buffer.from(`<svg width="819" height="1024">
                ${drawText(tituloStr, true, styleIdx === 0 ? 150 : 600, 400, 36)}
                ${drawText(corpoStr, false, styleIdx === 0 ? 220 : 750, 400, 24)}
            </svg>`);

            finalBuffer = await sharp(molduraPath).composite([
                { input: art, left: box.x, top: box.y },
                { input: textSVG }
            ]).jpeg({ quality: 95 }).toBuffer();
        } 
        else {
            // MODELO 02 (PADRÃO): MAGAZINE DINÂMICO
            const estilo = eCapa ? 0 : (this.moldurasIndex % 3);
            this.moldurasIndex++;
            let imgBox = { x: PAD, y: 0, w: W - (PAD*2), h: 600 };
            let tTop = { y: 200, h: 400 }; let tBot = { y: 0, h: 0 };

            if (estilo === 0) { imgBox.y = H - 750; } // Foto baixo
            else if (estilo === 1) { imgBox.y = (H - 600) / 2 + 50; } // Foto meio
            else { imgBox.y = 200; tBot = { y: 850, h: 400 }; tTop = { y: 0, h: 0 }; } // Foto cima

            let svgTexts = "";
            if (tTop.y > 0) {
                svgTexts += drawText(tituloStr, true, tTop.y, tTop.h);
                svgTexts += drawText(corpoStr, false, tTop.y + 150, tTop.h);
            } else {
                svgTexts += drawText(tituloStr, true, tBot.y, tBot.h);
                svgTexts += drawText(corpoStr, false, tBot.y + 150, tBot.h);
            }

            const FINAL_SVG = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${W}" height="${H}" fill="#FDFDFD"/>
                ${headerSVG}
                ${svgTexts}
                ${avatarSVG_Bottom}
                <text x="180" y="${H - 105}" font-family="Arial Black, sans-serif" font-size="28" fill="#111" font-weight="900">${process.env.NOME || "Herickson Maia"}</text>
                <text x="180" y="${H - 75}" font-family="Arial, sans-serif" font-size="22" fill="#666">${brand.profile.handle || "@hericksonmaia"}</text>
                <circle cx="${W - 100}" cy="${H - 90}" r="30" fill="#444"/>
                <path d="M ${W-105} ${H-100} L ${W-95} ${H-90} L ${W-105} ${H-80}" stroke="white" stroke-width="4" fill="none" />
            </svg>`);

            const clipRect = Buffer.from(`<svg><rect width="${imgBox.w}" height="${imgBox.h}" rx="35" ry="35" fill="#fff"/></svg>`);
            const arteFinal = await sharp(bgBuffer).resize(imgBox.w, imgBox.h, { fit: "cover" }).composite([{ input: clipRect, blend: 'dest-in' }]).png().toBuffer();
            finalBuffer = await sharp(FINAL_SVG).composite([{ input: arteFinal, left: imgBox.x, top: imgBox.y }]).jpeg({ quality: 95 }).toBuffer();
        }

        const outBase = path.resolve(this.basePath, "posts", pastaDestino);
        if (!fs.existsSync(outBase)) fs.mkdirSync(outBase, { recursive: true });
        const filePath = path.join(outBase, nomeArquivo);
        fs.writeFileSync(filePath, finalBuffer);
        const url = await this.uploadToSupabase(finalBuffer, nomeArquivo, pastaDestino);
        return { publicUrl: url };
    }
}
