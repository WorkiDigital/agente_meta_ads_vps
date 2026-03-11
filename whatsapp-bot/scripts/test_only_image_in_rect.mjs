import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Coordenadas exatas das caixas cinzas detectadas anteriormente nas 3 molduras
const specs = [
    {
        id: "1_BAIXO",
        file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563942.png",
        box: { x: 59, y: 317, w: 701, h: 640 }, 
        textZone: "top"
    },
    {
        id: "2_MEIO",
        file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563956.png",
        box: { x: 59, y: 66, w: 701, h: 875 }, // Ocupa quase tudo
        textZone: "split"
    },
    {
        id: "3_CIMA",
        file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563985.png",
        box: { x: 59, y: 66, w: 701, h: 511 }, // Fica grudado no topo
        textZone: "bottom"
    }
];

const sampleArtPath = "C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\agente_meta_ads_vps\\whatsapp-bot\\posts\\2026-03-11\\manus-ai-v3\\slide-01.jpg";

const testTexts = [
    {
        titulo: "A Meta pode ter acabado de mudar o jogo do Instagram.",
        corpo: "Agora você poderá usar Manus AI conectada diretamente ao seu Instagram."
    },
    {
        titulo: "Até agora, usar IA no Instagram sempre foi complicado.",
        corpo: "Era preciso usar:\n\n• ferramentas externas\n• automações limitadas\n• APIs complexas\n• integrações cheias de erro\n\nTudo funcionando fora da plataforma."
    },
    {
        titulo: "Mas isso pode estar mudando.",
        corpo: "Com a Manus AI, a inteligência artificial poderá se conectar diretamente ao Instagram.\n\nSem intermediários."
    }
]

const outDir = path.join(__dirname, "..", "posts", "testes-finais");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function wrapText(text, maxCharsPerLine) {
    const words = text.split(" ");
    let lines = [];
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

async function run() {
    console.log("🛠️ Testando imagem DENTRO do box e texto FORA...");

    for (let i = 0; i < 3; i++) {
        const spec = specs[i];
        const textData = testTexts[i];
        const outPath = path.join(outDir, `teste_v3_slide_${i + 1}_${spec.id}.jpg`);

        // 1. Recorta a arte exatamente do tamanho da caixa e arredonda as pontas
        let borderRadius = 35;
        // Na moldura MEIO, as bordas cinzas ocupam a tela toda e parecem menos arredondadas ou retas embaixo, 
        // mas vamos aplicar 35 para garantir encaixe premium.
        const arteBuffer = await sharp(sampleArtPath)
            .resize(spec.box.w, spec.box.h, { fit: "cover" })
            .composite([{
                input: Buffer.from(`<svg><rect x="0" y="0" width="${spec.box.w}" height="${spec.box.h}" rx="${borderRadius}" ry="${borderRadius}" fill="#fff"/></svg>`),
                blend: 'dest-in'
            }])
            .png()
            .toBuffer();

        // 2. Prepara o SVG com o texto posicionado de acordo
        const TITULO_SIZE = 42;
        const CORPO_SIZE = 28;
        let svgTexts = "";

        if (spec.textZone === "top") {
            // Embaixo da header do avatar, e acima da caixa
            let currY = 140; 
            const tituloLines = wrapText(textData.titulo, 35);
            for (const l of tituloLines) {
                const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                svgTexts += `<text x="409" y="${currY}" font-family="Arial Black, Arial, sans-serif" font-size="${TITULO_SIZE}" fill="#111" font-weight="900" text-anchor="middle">${escaped}</text>`;
                currY += TITULO_SIZE * 1.2;
            }
            currY += 15;
            const corpoLines = wrapText(textData.corpo, 45);
            for (const l of corpoLines) {
                const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                svgTexts += `<text x="409" y="${currY}" font-family="Arial, sans-serif" font-size="${CORPO_SIZE}" fill="#444" text-anchor="middle">${escaped}</text>`;
                currY += CORPO_SIZE * 1.3;
            }
        } 
        else if (spec.textZone === "bottom") {
            // Abaixo da caixa 
            let currY = spec.box.y + spec.box.h + 60;
            const tituloLines = wrapText(textData.titulo, 35);
            for (const l of tituloLines) {
                const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                svgTexts += `<text x="409" y="${currY}" font-family="Arial Black, Arial, sans-serif" font-size="${TITULO_SIZE}" fill="#111" font-weight="900" text-anchor="middle">${escaped}</text>`;
                currY += TITULO_SIZE * 1.2;
            }
            currY += 15;
            const corpoParags = textData.corpo.split("\n");
            for(const p of corpoParags) {
                 const corpoLines = wrapText(p, 45);
                 for (const l of corpoLines) {
                     const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                     svgTexts += `<text x="409" y="${currY}" font-family="Arial, sans-serif" font-size="${CORPO_SIZE}" fill="#444" text-anchor="middle">${escaped}</text>`;
                     currY += CORPO_SIZE * 1.3;
                 }
                 currY += 10;
            }
        }
        else if (spec.textZone === "split") {
            // O espaço branco é minúsculo (avatar tá no meio do cinza quase).
            // A moldura 2 é um blocão. O texto não cabe no branco praticamente de forma elegante.
            // Para testarmos, vamos colocar um título sutil no rodapé e no topo se couber,
            // Ou então, desenhamos um painel transparente por cima da parte inferior da foto para o texto legivel.
            // Pelo comentário dele: "somente a image, dentro do retangulo". Então NADA de texto na moldura "meio"
            // que enche a tela, a menos que fique num cantinho. Vamos tentar só sobrepor e deixar sem texto, 
            // ou colocar o texto comprimido. Como é de meio, vamos colocar o texto por cima num rodapé escuro.
            let currY = spec.box.h - 150; // Quase no final do retângulo
            const overlayLines = wrapText(textData.titulo, 45);
            svgTexts += `<rect x="59" y="${currY - 50}" width="701" height="200" fill="rgba(0,0,0,0.6)" rx="35" ry="35" />`;
            for (const l of overlayLines) {
                const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                svgTexts += `<text x="409" y="${currY}" font-family="Arial Black, Arial, sans-serif" font-size="34" fill="#fff" font-weight="900" text-anchor="middle">${escaped}</text>`;
                currY += 40;
            }
        }

        const overlaySVG = Buffer.from(`
            <svg width="819" height="1024" xmlns="http://www.w3.org/2000/svg">
                ${svgTexts}
            </svg>
        `);

        await sharp(spec.file)
            .composite([
                { input: arteBuffer, left: spec.box.x, top: spec.box.y },
                { input: overlaySVG }
            ])
            .jpeg({ quality: 95 })
            .toFile(outPath);

        console.log(`✅ Salvo teste: ${outPath}`);
    }
}

run().catch(console.error);
