import { DesignerService } from "./services/DesignerService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usando o JSON V4 como base de conteúdo, mas gerando na pasta V5
const dataPath = path.join(__dirname, "..", "data", "manus_ai_carousel_v4.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const designer = new DesignerService(path.join(__dirname, ".."));

async function generate() {
    console.log(`🚀 Iniciando a geração V5 do carrossel (Layout Dinâmico): ${data.tema}`);

    for (const [index, slide] of data.slides.entries()) {
        console.log(`\n⏳ Gerando slide ${index + 1} de ${data.slides.length}: ${slide.nome_arquivo}`);
        try {
            const result = await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: "2026-03-11/manus-ai-v5-noticia",
                nomeArquivo: slide.nome_arquivo,
                caminhoImagemLocal: slide.caminhoImagemLocal || null,
                eCapa: index === 0 // O primeiro slide ganha tratamento de capa (Seta + Estilo 0)
            });
            console.log(`✅ Slide ${index + 1} finalizado.`);
            if (result && result.publicUrl) {
                console.log(`☁️ URL pública: ${result.publicUrl}`);
            }
        } catch (error) {
            console.error(`❌ Erro no slide ${index + 1}:`, error.message);
        }
        
        // Pequena pausa entre slides
        if (index < data.slides.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    console.log(`\n🎉 Carrossel (V5) gerado na pasta: posts/2026-03-11/manus-ai-v5-noticia`);
}

generate().catch(err => {
    console.error("💥 Erro fatal na geração:", err);
});
