import { DesignerService } from "./src/services/DesignerService.js";

const designer = new DesignerService(process.cwd());

const slides = [
    { texto: "Um brasileiro de 20 anos criou uma IA para detectar corrupção.", prompt: "Young Brazilian man standing confidently with data screens behind him, city backdrop, cinematic" },
    { texto: "Os dados sobre gastos públicos já são abertos, mas estão espalhados e difíceis de analisar.", prompt: "Government documents scattered on desk with digital data overlays, blue tones, professional" },
    { texto: "A IA cruza milhares de dados automaticamente: CPF, contratos, vínculos.", prompt: "Artificial intelligence neural network connecting data points, futuristic blue theme, clean" }
];

console.log(`🧪 Testando geração de ${slides.length} slides...\n`);

for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    console.log(`📸 Slide ${i+1}/${slides.length}...`);
    const start = Date.now();
    try {
        const result = await designer.gerarSlidePremium({
            texto: s.texto,
            promptImagem: s.prompt,
            pastaDestino: "2026-03-10/teste-carrossel",
            nomeArquivo: `slide-${String(i+1).padStart(2,'0')}.jpg`
        });
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  ✅ OK em ${elapsed}s → ${result.localPath}`);
    } catch (e) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  ❌ ERRO em ${elapsed}s → ${e.message?.substring(0, 200)}`);
    }
}
console.log("\n🏁 Teste concluído!");
