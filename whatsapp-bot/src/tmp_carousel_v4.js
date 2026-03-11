import { DesignerService } from "./services/DesignerService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "..", "data", "manus_ai_carousel_v4.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const designer = new DesignerService(path.join(__dirname, ".."));

async function generate() {
    console.log(`🚀 Iniciando a geração V4 do carrossel (com imagem local): ${data.tema}`);

    for (const [index, slide] of data.slides.entries()) {
        console.log(`\n⏳ Gerando slide ${index + 1} de ${data.slides.length}: ${slide.nome_arquivo}`);
        try {
            const result = await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: data.pasta_destino,
                nomeArquivo: slide.nome_arquivo,
                caminhoImagemLocal: slide.caminhoImagemLocal // Repassando imagem local caso exista
            });
            console.log(`✅ Slide ${index + 1} finalizado.`);
            if (result && result.publicUrl) {
                console.log(`☁️ URL pública: ${result.publicUrl}`);
            }
        } catch (error) {
            console.error(`❌ Erro no slide ${index + 1}:`, error.message);
        }
        
        // Pequena pausa entre slides para evitar limites de API
        if (index < data.slides.length - 1) {
            console.log("⏸️ Aguardando 4 segundos para o próximo slide...");
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }

    console.log(`\n🎉 Carrossel (V4) gerado com sucesso na pasta: ${data.pasta_destino}`);
}

generate().catch(err => {
    console.error("💥 Erro fatal na geração:", err);
});
