import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DesignerService } from "../src/services/DesignerService.js";
import { CopyService } from "../src/services/CopyService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Analisa os argumentos para o script
const args = process.argv.slice(2);
const jsonIdx = args.indexOf('--json');
const fileIdx = args.indexOf('--file');
const noCopy = args.includes('--no-copy');

let config;
if (jsonIdx !== -1) {
    config = JSON.parse(args[jsonIdx + 1]);
} else if (fileIdx !== -1) {
    const configPath = path.resolve(args[fileIdx + 1]);
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} else {
    console.error('❌ Informe o JSON com --json "{...}" ou um arquivo com --file "caminho.json"');
    process.exit(1);
}
const projectRoot = path.join(__dirname, "..", "..", "..");
const designer = new DesignerService(projectRoot);
const copy = new CopyService(projectRoot);

async function main() {
    const { tipo, pasta_destino, slides, tema, nicho, tom_de_voz } = config;
    console.log(`🚀 Iniciando geração de post ${tipo}...`);

    for (const slide of slides) {
        try {
            await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: pasta_destino,
                nomeArquivo: slide.nome_arquivo
            });
        } catch (error) {
            console.error(`❌ Erro no slide ${slide.nome_arquivo}:`, error.message);
        }
    }

    console.log(`\n🎉 Imagens concluídas! Os arquivos estão em: /posts/${pasta_destino}`);

    // Gera a legenda SEO automaticamente (a menos que --no-copy seja passado)
    if (!noCopy) {
        console.log("\n✍️  Gerando legenda SEO automaticamente...\n");
        try {
            const textosSlides = slides.map(s => s.texto);
            const temaFinal = tema || slides[0]?.texto?.split("\n")[0] || "Post de conteúdo";

            const resultado = await copy.gerarLegendaSEO({
                tema: temaFinal,
                textosSlides,
                nicho: nicho || "Tráfego Pago e Marketing Digital",
                tomDeVoz: tom_de_voz || "autoritário, direto, provocativo, focado em resultado"
            });

            const legendaPath = copy.salvarLegenda(resultado.legendaCompleta, pasta_destino);

            console.log("\n📋 ═══════════════════════════════════════");
            console.log("   LEGENDA GERADA (Preview):");
            console.log("═══════════════════════════════════════════\n");
            console.log(resultado.legendaCompleta);
            console.log("\n═══════════════════════════════════════════");
            console.log(`📝 Arquivo salvo em: ${legendaPath}`);
        } catch (error) {
            console.error(`❌ Erro ao gerar legenda SEO:`, error.message);
        }
    }

    console.log(`\n✅ Processo 100% concluído!`);
}

main().catch(console.error);
