import { DesignerService } from './services/DesignerService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

async function run() {
    console.log("🚀 Iniciando geração do carrossel: MANUS AI + INSTAGRAM");
    
    const designer = new DesignerService(projectRoot);
    const pastaDestino = `manus-ai-insta-${Date.now()}`;
    const MY_PHOTO_PATH = path.join(projectRoot, "fotos", "foto-1773008385-4.jpg");

    const slides = [
        {
            nomeArquivo: "01_capa.jpg",
            texto: "🚨 A META MUDOU O JOGO DO INSTAGRAM\n\nAgora você poderá usar a Manus AI conectada diretamente ao seu Instagram.",
            promptImagem: "Futuristic digital interface showing Meta logo and AI brain connection, neon blue and violet lighting, 8k professional"
        },
        {
            nomeArquivo: "02_problema.jpg",
            texto: "O ANTIGO PROBLEMA\n\nUsar IA no Instagram sempre foi complicado. Era preciso usar ferramentas externas e APIs cheias de erros.",
            promptImagem: "Messy digital grid with broken connection icons and loading symbols, tech frustration, 8k"
        },
        {
            nomeArquivo: "03_solucao.jpg",
            texto: "SEM INTERMEDIÁRIOS\n\nCom a Manus AI, a inteligência artificial poderá se conectar diretamente ao Instagram de forma nativa.",
            promptImagem: "Seamless high-tech connection bridge between two glowing digital spheres, clean aesthetic, 8k"
        },
        {
            nomeArquivo: "04_tarefas.jpg",
            texto: "O QUE A IA FARÁ?\n\n• Criação de conteúdo\n• Análise de desempenho\n• Organização de posts\n• Otimização de estratégia",
            promptImagem: "Digital assistant dashboard showing post analytics and content calendar, modern professional UI, 8k"
        },
        {
            nomeArquivo: "05_nova_fase.jpg",
            texto: "UMA NOVA FERA NAS REDES\n\nEstamos entrando na era das redes sociais operadas com ajuda de IA. Parte da operação será automatizada.",
            promptImagem: "Robotic hands interacting with a holographic smartphone showing Instagram feed, futuristic, 8k"
        },
        {
            nomeArquivo: "06_humano.jpg",
            texto: "O PONTO CRUCIAL\n\nA IA executa tarefas, mas não substitui estratégia, posicionamento e criatividade humana.",
            promptImagem: "A human hand reaching out to touch a digital light, symbol of creativity meeting technology, 8k"
        },
        {
            nomeArquivo: "07_vencedores.jpg",
            texto: "QUEM GANHA O JOGO?\n\n❌ Quem apenas executa tarefas\n✅ Quem entende de estratégia e comunicação estratégica.",
            promptImagem: "Chess board where the king is a digital brain, strategic professional look, 8k"
        },
        {
            nomeArquivo: "08_proxima_geracao.jpg",
            texto: "IA + ESTRATÉGIA HUMANA\n\nQuem aprender a usar essas ferramentas primeiro vai sair na frente de todo o mercado.",
            promptImagem: "Modern digital racer crossing a glowing finish line, winner aesthetic, 8k"
        },
        {
            nomeArquivo: "09_cta.jpg",
            texto: "QUER ENTENDER O FUTURO?\n\nA IA está mudando o marketing digital. Se você quer entender antes de todos, me siga agora.\n\n👉 Toque no botão seguir",
            promptImagem: "", 
            caminhoImagemLocal: MY_PHOTO_PATH
        }
    ];

    for (const slide of slides) {
        try {
            console.log(`🖼️ Gerando: ${slide.nomeArquivo}...`);
            await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: pastaDestino,
                nomeArquivo: slide.nomeArquivo,
                caminhoImagemLocal: slide.caminhoImagemLocal
            });
            console.log(`✅ OK: ${slide.nomeArquivo}`);
        } catch (error) {
            console.error(`❌ Erro em ${slide.nomeArquivo}:`, error.message);
        }
    }

    console.log(`\n✨ Carrossel finalizado na pasta: posts/${pastaDestino}`);
}

run();
