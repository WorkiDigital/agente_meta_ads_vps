import { DesignerService } from "./src/services/DesignerService.js";

const designer = new DesignerService(process.cwd());

const texto = `Um brasileiro de apenas 20 anos criou uma IA para detectar corrupção.

E a tecnologia funciona cruzando CPFs de políticos com bases de dados públicas.`;

const promptImagem = "A young Brazilian man in his 20s standing confidently in front of multiple holographic screens displaying data analytics, government databases and AI neural networks. Futuristic cyberpunk Brazilian cityscape in the background with neon blue and green lights. Cinematic lighting, dramatic angle, 8k quality.";

try {
    const result = await designer.gerarSlidePremium({
        texto,
        promptImagem,
        pastaDestino: "2026-03-10/ia-corrupcao",
        nomeArquivo: "slide-01.jpg"
    });
    console.log("✅ Gerado com sucesso!");
    console.log("📁 Local:", result.localPath);
    if (result.publicUrl) console.log("☁️ Supabase:", result.publicUrl);
} catch (e) {
    console.error("❌ Erro:", e.message);
}
