/**
 * Teste rápido do CopyService (Skill de Copy Estratégico)
 * Uso: node --env-file=.env scripts/testar-copy.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { CopyService } from "../src/services/CopyService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const copy = new CopyService(path.join(__dirname, ".."));

const resultado = await copy.gerarLegendaSEO({
    tema: "O petróleo pode chegar a US$120 o barril e o impacto no mercado digital",
    textosSlides: [
        "O petróleo pode chegar a US$120 o barril.\n\nE quase ninguém está falando do impacto disso no mercado digital.",
        "Países já estão criando planos de emergência por causa da disparada do petróleo.",
        "Quando o petróleo dispara… toda a economia global sente. Transporte, produção, logística e energia ficam mais caros.",
        "E quando o custo da economia sobe, as empresas fazem uma coisa: Cortam orçamento. Marketing.",
        "Isso pode gerar um efeito direto no digital: redução de investimento em anúncios, queda no orçamento de marketing.",
        "Mas existe um efeito contrário: empresas precisam de mais eficiência em aquisição de clientes. Tráfego pago, performance, automação.",
        "Crises econômicas não acabam com o marketing. Elas apenas separam quem tem estratégia de quem depende de sorte.",
        "Se o petróleo continuar subindo, o impacto não ficará só na gasolina. Ele pode mudar como empresas investem em crescimento digital."
    ],
    nicho: "Tráfego Pago e Marketing Digital",
    tomDeVoz: "autoritário, direto, provocativo, focado em resultado"
});

console.log("\n📋 ═══════════════════════════════════════");
console.log("   LEGENDA COMPLETA GERADA:");
console.log("═══════════════════════════════════════════\n");
console.log(resultado.legendaCompleta);
console.log("\n═══════════════════════════════════════════\n");

// Salva na pasta do carrossel do petróleo
copy.salvarLegenda(resultado.legendaCompleta, "teste-copy");
