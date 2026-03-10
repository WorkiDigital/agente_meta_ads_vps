import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
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

// Definição das Ferramentas (Tools)
const tools = [
    {
        functionDeclarations: [
            {
                name: "gerar_post_premium",
                description: "Gera as artes e copy para um post ou carrossel premium seguindo a estratégia do Herickson.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tipo: { type: "STRING", enum: ["unico", "carrossel"] },
                        pasta_destino: { type: "STRING", description: "Caminho da pasta (ex: 2026-03-10/meu-post)" },
                        tema: { type: "STRING" },
                        nicho: { type: "STRING" },
                        tom_de_voz: { type: "STRING" },
                        slides: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    texto: { type: "STRING" },
                                    promptImagem: { type: "STRING" },
                                    nome_arquivo: { type: "STRING" }
                                }
                            }
                        }
                    },
                    required: ["tipo", "pasta_destino", "slides"]
                }
            },
            {
                name: "publicar_no_instagram",
                description: "Publica um conteúdo já gerado no Instagram.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tipo: { type: "STRING", enum: ["unico", "carrossel"] },
                        pasta: { type: "STRING", description: "Nome da pasta dentro de /posts" },
                        legenda: { type: "STRING" }
                    },
                    required: ["tipo", "pasta", "legenda"]
                }
            },
            {
                name: "get_facebook_ads_insights",
                description: "Busca métricas de desempenho (ROI, CTR, CPC) de uma conta de anúncios do Facebook.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        ad_account_id: { type: "STRING", description: "ID da conta (ex: act_3174606892664917)" },
                        date_preset: { type: "STRING", description: "Período: today, last_7d, last_30d, etc." },
                        level: { type: "STRING", enum: ["campaign", "adset", "ad", "account"] }
                    },
                    required: ["ad_account_id", "date_preset"]
                }
            },
            {
                name: "get_instagram_profile_insights",
                description: "Obtém métricas do Perfil do Instagram (Alcance, Visitas, Impressões, Seguidores).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        metricas: { type: "STRING", description: "Ex: impressions,reach,profile_views,follower_count" },
                        periodo: { type: "STRING", enum: ["day", "week", "month"] }
                    },
                    required: ["metricas"]
                }
            },
            {
                name: "analisar_postagem_instagram",
                description: "Obtém dados completos de uma postagem específica (curtidas, comentários, salvamentos e alcance).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        media_id: { type: "STRING", description: "O ID único da publicação" }
                    },
                    required: ["media_id"]
                }
            },
            {
                name: "criar_grupo_whatsapp",
                description: "Cria um novo grupo no WhatsApp com o nome especificado.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        nome_grupo: { type: "STRING" },
                        participantes: { 
                            type: "ARRAY", 
                            items: { type: "STRING" }, 
                            description: "Lista de números com DDI (ex: ['558599...'])" 
                        }
                    },
                    required: ["nome_grupo"]
                }
            }
        ]
    }
];

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: fs.readFileSync(path.join(__dirname, ".agente_estrategista_rules"), "utf8"),
    tools: tools
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

async function enviarMensagem(jid, texto) {
    try {
        await evolutionApi.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
            number: jid, // O componente 'number' na Evolution agora aceita JIDs (@s.whatsapp.net ou @g.us)
            text: texto
        });
    } catch (e) {
        console.error("Erro ao enviar msg:", e.message);
    }
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

async function processarAudio(instance, keyId) {
    try {
        const response = await evolutionApi.get(`/message/getBase64/${instance}?keyId=${keyId}`);
        if (response.data?.base64) {
            return {
                inlineData: {
                    data: response.data.base64.split(",")[1] || response.data.base64,
                    mimeType: "audio/ogg; codecs=opus"
                }
            };
        }
    } catch (e) {
        console.error("Erro ao processar áudio:", e.message);
    }
    return null;
}

const functionHandlers = {
    gerar_post_premium: async (numero, args) => {
        await enviarMensagem(numero, "🎨 Entendido! Vou começar a gerar as artes do seu post premium agora...");
        const urlsGeradas = [];
        for (const slide of args.slides) {
            const { publicUrl } = await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: args.pasta_destino,
                nomeArquivo: slide.nome_arquivo
            });
            if (publicUrl) urlsGeradas.push(publicUrl);
        }
        const textosSlides = args.slides.map(s => s.texto);
        const copyResult = await copy.gerarLegendaSEO({
            tema: args.tema || "Post Estratégico",
            textosSlides,
            nicho: args.nicho,
            tomDeVoz: args.tom_de_voz
        });
        copy.salvarLegenda(copyResult.legendaCompleta, args.pasta_destino);
        if (urlsGeradas.length > 0) {
            const linkTexto = urlsGeradas.map((url, i) => `🖼️ Slide ${i+1}: ${url}`).join("\n");
            await enviarMensagem(numero, `📸 Prévia das artes geradas:\n\n${linkTexto}`);
        }
        return `Post gerado com sucesso na pasta ${args.pasta_destino}. Legenda sugerida:\n${copyResult.legendaCompleta}`;
    },
    publicar_no_instagram: async (numero, args) => {
        await enviarMensagem(numero, "🚀 Iniciando a publicação no seu Instagram...");
        const pastaRelativa = `posts/${args.pasta}`;
        const script = args.tipo === "carrossel" ? "postar-carrosel-instagram.mjs" : "postar-unico-instagram.mjs";
        const command = `node ${script} --pasta "${pastaRelativa}" --caption "${args.legenda.replace(/"/g, '\\"')}"`;
        
        return new Promise((resolve) => {
            exec(command, { cwd: __dirname }, (error, stdout) => {
                if (error) resolve(`Erro na publicação: ${error.message}`);
                const matchLink = stdout.match(/https:\/\/www\.instagram\.com\/p\/[a-zA-Z0-9_-]+\//);
                resolve(matchLink ? `Post publicado com sucesso! Link: ${matchLink[0]}` : "Post publicado com sucesso!");
            });
        });
    },
    get_facebook_ads_insights: async (numero, args) => {
        const META_TOKEN = process.env.META_ACCESS_TOKEN;
        const url = `https://graph.facebook.com/v19.0/${args.ad_account_id}/insights`;
        try {
            const res = await axios.get(url, {
                params: {
                    access_token: META_TOKEN,
                    fields: "reach,impressions,spend,cpc,cpm,ctr,actions",
                    date_preset: args.date_preset,
                    level: args.level || "campaign"
                }
            });
            return JSON.stringify(res.data);
        } catch (e) {
            return `Erro ao buscar insights: ${e.response?.data?.error?.message || e.message}`;
        }
    },
    get_instagram_profile_insights: async (numero, args) => {
        const META_TOKEN = process.env.META_ACCESS_TOKEN;
        const IG_USER_ID = "17841401666623403";
        const url = `https://graph.facebook.com/v19.0/${IG_USER_ID}/insights`;
        try {
            const res = await axios.get(url, {
                params: {
                    access_token: META_TOKEN,
                    metric: args.metricas,
                    period: args.periodo || "day"
                }
            });
            return JSON.stringify(res.data);
        } catch (e) {
            return `Erro ao buscar insights IG: ${e.response?.data?.error?.message || e.message}`;
        }
    },
    analisar_postagem_instagram: async (numero, args) => {
        const META_TOKEN = process.env.META_ACCESS_TOKEN;
        try {
            const mediaInfo = await axios.get(`https://graph.facebook.com/v19.0/${args.media_id}`, {
                params: {
                    access_token: META_TOKEN,
                    fields: "caption,media_type,media_url,permalink,timestamp,username,comments_count,like_count"
                }
            });
            return JSON.stringify(mediaInfo.data);
        } catch (e) {
            return `Erro ao analisar post: ${e.response?.data?.error?.message || e.message}`;
        }
    },
    criar_grupo_whatsapp: async (numero, args) => {
        try {
            const res = await evolutionApi.post(`/group/create/${EVOLUTION_INSTANCE}`, {
                groupName: args.nome_grupo,
                participants: args.participantes || []
            });
            return `Grupo '${args.nome_grupo}' criado com sucesso! JID: ${res.data?.id}`;
        } catch (e) {
            return `Erro ao criar grupo: ${e.response?.data?.error?.message || e.message}`;
        }
    }
};

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    try {
        const body = req.body;
        if (!["messages.upsert", "MESSAGES_UPSERT"].includes(body.event)) return;

        const data = body.data;
        
        // --- TRAVA DE SEGURANÇA: EXCLUSIVO PARA O QG DE PERFORMANCE ---
        const QG_PERFORMANCE_JID = "120363407547741321@g.us";
        const remoteJid = data?.key?.remoteJid || "";
        
        if (remoteJid !== QG_PERFORMANCE_JID) {
            // Ignora silenciosamente tudo que não for do grupo autorizado
            return;
        }

        // Evita loop infinito: Ignora mensagens do bot no próprio grupo
        if (data?.key?.fromMe) {
            return;
        }
        
        const isGroup = true; // Por definição, já sabemos que é grupo agora
        const numero = remoteJid; // Usamos o JID do grupo para a sessão
        
        // Identifica quem enviou
        const remetente = data?.key?.participant || remoteJid;
        const nomeUsuario = data?.pushName || "Usuário";
        
        const content = [];
        
        // Texto
        const texto = data?.message?.conversation ?? data?.message?.extendedTextMessage?.text;
        if (texto) content.push({ text: texto });

        // Áudio (Mágica Multimodal)
        const isAudio = data?.message?.audioMessage || data?.message?.pttMessage;
        if (isAudio) {
            const audioPart = await processarAudio(EVOLUTION_INSTANCE, data.key.id);
            if (audioPart) content.push(audioPart);
        }

        if (content.length === 0) return;

        console.log(`📩 [${isGroup ? "GRUPO" : "PV"}] ${nomeUsuario} (${remetente}): ${isAudio ? "Áudio" : "Texto"}`);

        if (!chatSessions[numero]) {
            chatSessions[numero] = model.startChat({ history: [] });
        }

        const chat = chatSessions[numero];
        let result = await chat.sendMessage(content);
        let call = result.response.functionCalls()?.[0];

        // Loop de Function Calling
        while (call) {
            const handler = functionHandlers[call.name];
            const toolResponse = handler ? await handler(numero, call.args) : "Ferramenta não encontrada.";
            
            result = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: { result: toolResponse }
                }
            }]);
            call = result.response.functionCalls()?.[0];
        }

        const finalResponse = result.response.text();
        if (finalResponse) {
            await enviarMensagem(numero, finalResponse);
        }

    } catch (err) {
        console.error("Erro no Webhook:", err);
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Agente VPS Online (Multimodal + Tools) na porta ${PORT}`);
});
