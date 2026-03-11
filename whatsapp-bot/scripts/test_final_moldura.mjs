import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Coordenadas detectadas pelo nosso script
const specs = [
    {
        id: "1_BAIXO",
        file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563942.png",
        box: { x: 59, y: 317, w: 701, h: 640 }, // Ajustado Y parabaixo da foto
        textZone: "top"
    },
    {
        id: "2_MEIO",
        file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563956.png",
        box: { x: 59, y: 435, w: 701, h: 511 }, // Ajustado (Meio da tela)
        textZone: "split"
    },
    {
        id: "3_CIMA",
        file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563985.png",
        box: { x: 59, y: 184, w: 701, h: 486 }, // Perto do topo
        textZone: "bottom"
    }
];

// Usaremos a imagem do slide 1 v3 do carrossel como "arte" para testar
const sampleArtPath = "C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\agente_meta_ads_vps\\whatsapp-bot\\posts\\2026-03-11\\manus-ai-v3\\slide-01.jpg";

const outDir = path.join(__dirname, "..", "posts", "00_PREVIAS_CORRETAS");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function testMerge() {
    console.log("🛠️ Testando recorte de arte + texto externo na moldura...");

    for (let i = 0; i < 3; i++) {
        const spec = specs[i];
        const outPath = path.join(outDir, `teste_v2_slide_${i + 1}_${spec.id}.jpg`);

        // 1. Pega a arte bruta (quadrada ou retangular) e redimensiona cortando (cover)
        // para encaixar exatamente na caixa cinza com cantos BEM arredondados (rx/ry=40)
        
        const rectSvg = Buffer.from(
            `<svg><rect x="0" y="0" width="${spec.box.w}" height="${spec.box.h}" rx="30" ry="30"/></svg>`
        );

        const arteRecortada = await sharp(sampleArtPath)
            .resize(spec.box.w, spec.box.h, { fit: "cover" })
            .composite([{
                input: Buffer.from(`<svg><rect x="0" y="0" width="${spec.box.w}" height="${spec.box.h}" rx="40" ry="40" fill="#fff"/></svg>`),
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();

        // 2. Coloca o texto FORA da caixa cinza
        // Lógica simplificada de posições
        let textY = 0;
        if (spec.textZone === "top") textY = 220; 
        if (spec.textZone === "split") textY = 180; // E depois mais texto lá embaixo
        if (spec.textZone === "bottom") textY = spec.box.y + spec.box.h + 80;

        const overlaySVG = Buffer.from(`
            <svg width="819" height="1024" xmlns="http://www.w3.org/2000/svg">
                <!-- Título fora da moldura -->
                <text x="409" y="${textY}" font-family="Arial Black, Helvetica, sans-serif" font-size="34" fill="#333" font-weight="900" text-anchor="middle">Teste de Texto Fora da Imagem</text>
                <text x="409" y="${textY + 45}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#555" text-anchor="middle">Este é o corpo do texto simulando</text>
                <text x="409" y="${textY + 80}" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#555" text-anchor="middle">o design do Instagram real.</text>
            </svg>
        `);

        // 3. Mescla tudo
        await sharp(spec.file)
            .composite([
                // Arte encaixada em cima da caixa cinza
                { input: arteRecortada, left: spec.box.x, top: spec.box.y },
                // SVG de textos fora
                { input: overlaySVG }
            ])
            .jpeg({ quality: 98 })
            .toFile(outPath);

        console.log(`✅ Salvo: ${outPath}`);
    }
}

testMerge().catch(console.error);
