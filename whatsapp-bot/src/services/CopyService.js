import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class CopyService {
    constructor(basePath) {
        this.basePath = basePath || path.join(__dirname, "..", "..");
        this.brandPath = path.join(this.basePath, "data", "brand.json");
    }

    readBrand() {
        if (!fs.existsSync(this.brandPath)) return null;
        return JSON.parse(fs.readFileSync(this.brandPath, "utf8"));
    }

    /**
     * Gera uma legenda completa otimizada para Instagram com SEO.
     * 
     * @param {Object} params
     * @param {string} params.tema - O tema central do post/carrossel
     * @param {string[]} params.textosSlides - Array com os textos de cada slide (para extrair contexto)
     * @param {string} params.nicho - O nicho do perfil (ex: "Tráfego Pago", "Marketing Digital")
     * @param {string} params.tomDeVoz - Tom de voz desejado (ex: "autoritário", "educativo", "provocativo")
     * @returns {Promise<{legenda: string, hashtags: string, legendaCompleta: string}>}
     */
    async gerarLegendaSEO({ tema, textosSlides, nicho, tomDeVoz }) {
        console.log(`✍️ TOOL: gerarLegendaSEO | Tema: ${tema} | Nicho: ${nicho}`);
        const brandData = this.readBrand();
        const profile = brandData?.profile || {};
        const handle = profile.handle || "@hericksonmaia";
        const nome = profile.name || "Herickson Maia";

        // Concatena os textos dos slides para dar contexto completo ao Gemini
        const contextoSlides = textosSlides
            .map((t, i) => `Slide ${i + 1}: ${t}`)
            .join("\n");

        const prompt = `Você é um copywriter especialista em Instagram para o nicho de "${nicho || "Marketing Digital e Tráfego Pago"}".
O perfil é de ${nome} (${handle}).
Tom de voz: ${tomDeVoz || "autoritário, direto, provocativo, focado em resultado"}.

Gere uma legenda completa e otimizada para Instagram sobre o seguinte tema:
"${tema}"

Contexto completo dos slides do carrossel:
${contextoSlides}

REGRAS OBRIGATÓRIAS:

1. **GANCHO SEO (Primeiras 2 linhas - ANTES do corte "...mais"):**
   - Máximo 125 caracteres nas primeiras 2 linhas juntas
   - Deve conter a palavra-chave principal do tema
   - Deve provocar curiosidade ou urgência para o leitor clicar em "mais"
   - Use emoji estratégico (máximo 1-2)

2. **CORPO DA COPY (Storytelling de Conversão):**
   - Desenvolva o argumento em 3-4 parágrafos curtos
   - Cada parágrafo com no máximo 3 linhas
   - Separe parágrafos com uma linha em branco
   - Inclua dados ou fatos que reforcem autoridade
   - Termine com um CTA claro (chamar para ação: comentar, salvar, compartilhar ou clicar no link da bio)
   - Use a técnica AIDA (Atenção, Interesse, Desejo, Ação)

3. **BLOCO DE HASHTAGS (30 hashtags divididas em 3 categorias):**
   Gere exatamente 30 hashtags divididas assim:
   - 10 hashtags de ALTO VOLUME (>500k posts, termos amplos do nicho)
   - 10 hashtags de NICHO (50k-500k posts, termos específicos do tema)
   - 10 hashtags de MARCA/LONG-TAIL (termos ultra-específicos + marca pessoal)
   Inclua sempre: #${handle.replace("@", "")}

4. **FORMATAÇÃO:**
   - Separe o corpo das hashtags com uma linha "—"
   - Use quebras de linha reais (não "\\n") entre parágrafos
   - Espaçamento visual a cada 3 linhas para leitura mobile
   - NÃO use markdown (sem asteriscos, sem negrito)

Retorne APENAS a legenda completa pronta para colar no Instagram. Nada de explicações ou comentários extras.`;

        console.log("✍️  Gerando copy SEO via Gemini...");

        const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const textoGerado = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!textoGerado) {
            throw new Error("O Gemini não retornou uma legenda.");
        }

        // Separar legenda do bloco de hashtags
        const partes = textoGerado.split("—");
        const legenda = (partes[0] || textoGerado).trim();
        const hashtags = partes.length > 1 ? partes.slice(1).join("—").trim() : "";

        return {
            legenda,
            hashtags,
            legendaCompleta: textoGerado.trim()
        };
    }

    /**
     * Salva a legenda gerada em um arquivo .txt formatado para Instagram.
     * 
     * @param {string} legendaCompleta - Texto completo da legenda
     * @param {string} pastaDestino - Subpasta dentro de /posts/
     * @param {string} nomeArquivo - Nome do arquivo (ex: "legenda.txt")
     * @returns {string} Caminho do arquivo salvo
     */
    salvarLegenda(legendaCompleta, pastaDestino, nomeArquivo = "legenda.txt") {
        const outDir = path.join(this.basePath, "posts", pastaDestino);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const filePath = path.join(outDir, nomeArquivo);
        fs.writeFileSync(filePath, legendaCompleta, "utf8");
        console.log(`📝 Legenda salva em: ${filePath}`);
        return filePath;
    }
}
