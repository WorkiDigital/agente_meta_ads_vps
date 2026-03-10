import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DesignerService } from "./src/services/DesignerService.js";
import { CopyService } from "./src/services/CopyService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Configurações
const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: fs.readFileSync(path.join(__dirname, ".agente_estrategista_rules"), "utf8")
});

const designer = new DesignerService(__dirname);
const copy = new CopyService(__dirname);

const evolutionApi = axios.create({
    baseURL: EVOLUTION_URL,
    headers: {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
});

// Memória de Chat (Simples - em memória - na VPS pode ser Redis/DB futuramente)
const chatSessions = {}; 

async function enviarMensagem(numero, texto) {
    await evolutionApi.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
        number: numero,
        text: texto
    });
}

function extrairJson(texto) {
    const match = texto.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (e) {
            return null;
        }
    }
    return null;
}

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    try {
        const body = req.body;
        if (!["messages.upsert", "MESSAGES_UPSERT"].includes(body.event)) return;

        const data = body.data;
        if (data?.key?.fromMe) return;

        const remoteJid = data?.key?.remoteJid || "";
        const numero = remoteJid.replace("@s.whatsapp.net", "").replace("@lid", "");
        const texto = data?.message?.conversation ?? data?.message?.extendedTextMessage?.text;

        if (!numero || !texto) return;

        console.log(`📩 [${numero}]: ${texto}`);

        // Inicializa sessão se não existir
        if (!chatSessions[numero]) {
            chatSessions[numero] = model.startChat({
                history: [],
                generationConfig: { maxOutputTokens: 2000 }
            });
        }

        const chat = chatSessions[numero];
        
        // Envia mensagem para o Gemini (Cérebro)
        const result = await chat.sendMessage(texto);
        const resposta = result.response.text();

        console.log(`🤖 [Gemini]: ${resposta.substring(0, 100)}...`);

        // Detecta se o Gemini decidiu gerar um post (Skill de Design)
        if (resposta.includes("[GERAR_POST]")) {
            await enviarMensagem(numero, "🎨 Entendido! Vou começar a gerar as artes do seu post premium agora...");
            
            const configPost = extrairJson(resposta);
            if (configPost) {
                try {
                    // Executa Skill de Design
                    for (const slide of configPost.slides) {
                        await designer.gerarSlidePremium({
                            texto: slide.texto,
                            promptImagem: slide.promptImagem,
                            pastaDestino: configPost.pasta_destino,
                            nomeArquivo: slide.nome_arquivo
                        });
                    }

                    // Executa Skill de Copy
                    const textosSlides = configPost.slides.map(s => s.texto);
                    const copyResult = await copy.gerarLegendaSEO({
                        tema: configPost.tema || "Post Estratégico",
                        textosSlides,
                        nicho: configPost.nicho,
                        tomDeVoz: configPost.tom_de_voz
                    });
                    
                    copy.salvarLegenda(copyResult.legendaCompleta, configPost.pasta_destino);

                    await enviarMensagem(numero, `✅ Post Gerado com Sucesso!\n\n📂 Pasta: ${configPost.pasta_destino}\n\n📝 Legenda:\n${copyResult.legendaCompleta.substring(0, 500)}...`);
                } catch (err) {
                    await enviarMensagem(numero, `❌ Erro ao processar skills: ${err.message}`);
                }
            } else {
                await enviarMensagem(numero, "❌ O Gemini sugeriu gerar um post mas o formato do JSON estava inválido.");
            }
        } else {
            // Resposta normal de chat
            await enviarMensagem(numero, resposta);
        }

    } catch (err) {
        console.error("Erro no Webhook:", err);
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Agente VPS Online na porta ${PORT}`);
});
