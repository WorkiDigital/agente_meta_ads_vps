import { DesignerService } from "./services/DesignerService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "..", "data", "carousel_estilos.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const designer = new DesignerService(path.join(__dirname, ".."));

async function generate() {
    console.log(`🚀 Gerando Carrossel de Demonstração de Estilos...`);

    for (const [index, slide] of data.slides.entries()) {
        console.log(`\n⏳ Slide ${index + 1}: ${slide.nome_arquivo} (Modelo ${slide.modelo})`);
        try {
            await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: data.pasta_destino,
                nomeArquivo: slide.nome_arquivo,
                modelo: slide.modelo,
                eCapa: index === 0
            });
            console.log(`✅ OK.`);
        } catch (error) {
            console.error(`❌ Erro:`, error.message);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log(`\n🎉 Teste completo! Pasta: posts/${data.pasta_destino}`);
}

generate().catch(console.error);
