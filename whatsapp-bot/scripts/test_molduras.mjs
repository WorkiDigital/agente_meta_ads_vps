import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos das molduras na pasta do brain
const molduraPaths = [
    "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563942.png",
    "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563956.png",
    "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563985.png"
];

const testTexts = [
    "🚨 A Meta pode ter acabado de mudar o jogo do Instagram.\n\nAgora você poderá usar Manus AI conectada diretamente ao seu Instagram.",
    "Até agora, usar IA no Instagram sempre foi complicado.\n\nEra preciso usar:\n\n• ferramentas externas\n• automações limitadas\n• APIs complexas\n• integrações cheias de erro\n\nTudo funcionando fora da plataforma.",
    "Mas isso pode estar mudando.\n\nCom a Manus AI, a inteligência artificial poderá se conectar diretamente ao Instagram.\n\nSem intermediários."
];

const outDir = path.join(__dirname, "..", "posts", "testes-moldura");
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

async function testFrames() {
    console.log("🛠️ Iniciando teste das molduras isoladas...");

    for (let i = 0; i < 3; i++) {
        const moldura = molduraPaths[i];
        const textToDraw = testTexts[i];

        if (!fs.existsSync(moldura)) {
            console.error(`❌ Não achei a moldura de teste: ${moldura}`);
            continue;
        }

        const metadata = await sharp(moldura).metadata();
        const W = metadata.width;
        const H = metadata.height;
        
        console.log(`📏 Moldura ${i+1}: ${W}x${H} pixels`);

        let svgTexts = "";
        let currentY = H * 0.45; // Start writing roughly in the upper middle of the gray box
        
        // Simple text layout logic tailored for testing
        const paragraphs = textToDraw.split("\n\n");
        for (const p of paragraphs) {
            const lines = wrapText(p.replace(/\\n/g, "\n"), 40);
            for (const l of lines) {
                const escaped = l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                svgTexts += `<text x="${W/2}" y="${currentY}" font-family="Arial, sans-serif" font-size="46" fill="white" font-weight="bold" text-anchor="middle">${escaped}</text>`;
                currentY += 60;
            }
            currentY += 40; // Paragragh spacing
        }

        const overlay = Buffer.from(`
            <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
                ${svgTexts}
            </svg>
        `);

        const outFile = path.join(outDir, `teste_moldura_slide_0${i+1}.jpg`);
        
        await sharp(moldura)
            .composite([{ input: overlay }])
            .jpeg({ quality: 95 })
            .toFile(outFile);

        console.log(`✅ Teste salvo em: ${outFile}`);
    }
    console.log("🏁 Fim dos testes.");
}

testFrames().catch(console.error);
