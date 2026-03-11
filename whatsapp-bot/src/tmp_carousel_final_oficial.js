import { DesignerService } from "./services/DesignerService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "..", "data", "manus_ai_insta_oficial.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const designer = new DesignerService(path.join(__dirname, ".."));

async function generate() {
    console.log(`🚀 GERANDO CARROSSEL OFICIAL: ${data.tema}`);

    for (const [index, slide] of data.slides.entries()) {
        console.log(`\n⏳ Lâmina ${index + 1}/${data.slides.length}: ${slide.nome_arquivo}`);
        try {
            const result = await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: data.pasta_destino,
                nomeArquivo: slide.nome_arquivo,
                caminhoImagemLocal: slide.caminhoImagemLocal || null,
                modelo: slide.modelo || "02",
                eCapa: index === 0
            });
            console.log(`✅ Concluído.`);
            if (result && result.publicUrl) {
                console.log(`🔗 URL: ${result.publicUrl}`);
            }
        } catch (error) {
            console.error(`❌ Erro:`, error.message);
        }
        
        // Pausa entre slides
        if (index < data.slides.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    console.log(`\n🎉 Carrossel oficial finalizado! Pasta: posts/${data.pasta_destino}`);
}

generate().catch(err => {
    console.error("💥 Erro fatal:", err);
});
