import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const molduras = [
    { id: '1_BAIXO', file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563942.png" },
    { id: '2_MEIO', file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563956.png" },
    { id: '3_CIMA', file: "C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\d656dc86-8cdc-45f3-ae2c-c6b3e04b0584\\media__1773234563985.png" }
];

async function findGrayBox(filePath, id) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return null;
    }

    try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        // Carrega os pixels em formato raw (R, G, B, A sequenciais)
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

        let minX = info.width, maxX = 0;
        let minY = info.height, maxY = 0;
        
        // A cor da caixa nas imagens aparenta ser um cinza escuro.
        // Vamos procurar pixels onde os canais RGB são muito parecidos entre si,
        // mas não são brancos puros nem os azuis/rosa do logotipo do Instagram.
        // Tolerância de cor (o cinza que detectei tem aproximadamente R=80, G=76, B=76, ou seja, quase igual).
        
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * info.channels;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = info.channels === 4 ? data[idx + 3] : 255;
                
                // Ignora pixels transparentes
                if (a < 10) continue;

                // Checa se a cor é "cinza escuro": r, g, b próximos, e não é muito claro.
                const diffRG = Math.abs(r - g);
                const diffGB = Math.abs(g - b);
                const diffBR = Math.abs(b - r);
                
                if (r < 150 && diffRG < 15 && diffGB < 15 && diffBR < 15) {
                    // É um pixel da caixa cinza
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        const width = maxX - minX;
        const height = maxY - minY;

        console.log(`\n🔍 MOLDURA ${id}`);
        console.log(`Tamanho total: ${info.width}x${info.height}`);
        console.log(`Caixa cinza detetada:   X=${minX}, Y=${minY}, Wid=${width}, Hei=${height}`);
        
        return { id, minX, minY, width, height, totalW: info.width, totalH: info.height };

    } catch (err) {
        console.error("Erro ao analisar imagem:", err);
        return null;
    }
}

async function run() {
    console.log("Iniciando varredura para detectar as caixas cinzas...");
    const results = [];
    for (const m of molduras) {
        const res = await findGrayBox(m.file, m.id);
        if (res) results.push(res);
    }
    
    fs.writeFileSync('coords_molduras.json', JSON.stringify(results, null, 2));
    console.log("\n✅ Resultados salvos em coords_molduras.json");
}

run();
