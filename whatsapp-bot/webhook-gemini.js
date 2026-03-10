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
                description: "Publica um conteúdo já gerado no Instagram (imagem, carrossel ou Reels).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        tipo: { type: "STRING", enum: ["unico", "carrossel", "reels"] },
                        pasta: { type: "STRING", description: "Nome da pasta dentro de /posts" },
                        legenda: { type: "STRING" },
                        video_url: { type: "STRING", description: "URL pública do vídeo (obrigatório para Reels)" }
                    },
                    required: ["tipo", "pasta", "legenda"]
                }
            },
            {
                name: "get_facebook_ads_insights",
                description: "Busca métricas de desempenho (ROI, CTR, CPC) com comparativo automático do período anterior e variação percentual.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        ad_account_id: { type: "STRING", description: "ID da conta (ex: act_3174606892664917)" },
                        date_preset: { type: "STRING", description: "Período: today, last_7d, last_30d, etc." },
                        level: { type: "STRING", enum: ["campaign", "adset", "ad", "account"] },
                        comparar: { type: "BOOLEAN", description: "Se true, compara com o período anterior automaticamente" }
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
                name: "listar_posts_virais_instagram",
                description: "Lista as publicações mais virais (maior engajamento: likes + comentários) de um perfil nos últimos dias.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        dias: { type: "INTEGER", description: "Quantidade de dias de histórico (ex: 7)." }
                    },
                    required: ["dias"]
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
            },
            {
                name: "enviar_imagem_whatsapp",
                description: "Gera uma imagem com IA a partir de um prompt e envia direto como foto no grupo do WhatsApp.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        prompt: { type: "STRING", description: "Descrição detalhada da imagem a ser gerada" },
                        legenda: { type: "STRING", description: "Legenda opcional para a imagem" }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "agendar_post_instagram",
                description: "Agenda uma publicação no Instagram para data/hora futura usando a Content Publishing API da Meta.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        image_url: { type: "STRING", description: "URL pública da imagem (ex: link do Supabase)" },
                        legenda: { type: "STRING" },
                        data_hora: { type: "STRING", description: "Data/hora no formato ISO 8601 (ex: 2026-03-15T10:00:00)" }
                    },
                    required: ["image_url", "legenda", "data_hora"]
                }
            },
            {
                name: "buscar_tendencias",
                description: "Busca tendências do momento para um nicho específico e sugere ideias de conteúdo baseadas nelas.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        nicho: { type: "STRING", description: "Nicho ou tema (ex: tráfego pago, marketing digital, IA)" },
                        plataforma: { type: "STRING", description: "Plataforma alvo (ex: Instagram, TikTok, YouTube)" }
                    },
                    required: ["nicho"]
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
            number: jid,
            text: texto + "\u200B"
        });
    } catch (e) {
        console.error("Erro ao enviar msg:", e.message);
    }
}

async function enviarImagem(jid, base64, caption) {
    try {
        await evolutionApi.post(`/message/sendMedia/${EVOLUTION_INSTANCE}`, {
            number: jid,
            mediatype: "image",
            mimetype: "image/jpeg",
            caption: (caption || "") + "\u200B",
            media: base64
        });
    } catch (e) {
        console.error("Erro ao enviar imagem:", e.message);
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
        await enviarMensagem(numero, "🎨 Entendido! Gerando as artes do seu post premium...");
        const urlsGeradas = [];
        const buffersGerados = [];
        for (const slide of args.slides) {
            const result = await designer.gerarSlidePremium({
                texto: slide.texto,
                promptImagem: slide.promptImagem,
                pastaDestino: args.pasta_destino,
                nomeArquivo: slide.nome_arquivo
            });
            if (result.publicUrl) urlsGeradas.push(result.publicUrl);
            // Lê o buffer local para enviar inline no WhatsApp
            if (result.localPath && fs.existsSync(result.localPath)) {
                const buf = fs.readFileSync(result.localPath);
                buffersGerados.push({ base64: buf.toString('base64'), nome: slide.nome_arquivo });
            }
        }
        const textosSlides = args.slides.map(s => s.texto);
        const copyResult = await copy.gerarLegendaSEO({
            tema: args.tema || "Post Estratégico",
            textosSlides,
            nicho: args.nicho,
            tomDeVoz: args.tom_de_voz
        });
        copy.salvarLegenda(copyResult.legendaCompleta, args.pasta_destino);
        // Envia cada slide como IMAGEM INLINE no WhatsApp (não só link)
        for (let i = 0; i < buffersGerados.length; i++) {
            await enviarImagem(numero, buffersGerados[i].base64, `📸 Slide ${i+1} de ${buffersGerados.length}`);
        }
        // Envia a legenda/copy direto no grupo
        if (copyResult.legendaCompleta) {
            await enviarMensagem(numero, `📝 *Legenda sugerida:*\n\n${copyResult.legendaCompleta}`);
        }
        return `Post gerado com sucesso na pasta ${args.pasta_destino}. ${urlsGeradas.length} slides salvos na nuvem (Supabase).`;
    },
    publicar_no_instagram: async (numero, args) => {
        await enviarMensagem(numero, "🚀 Iniciando a publicação no seu Instagram...");
        
        // Suporte a Reels via Graph API
        if (args.tipo === "reels" && args.video_url) {
            const META_TOKEN = process.env.META_ACCESS_TOKEN;
            const IG_USER_ID = "17841401666623403";
            try {
                // 1. Criar container de Reels
                const container = await axios.post(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media`, null, {
                    params: {
                        access_token: META_TOKEN,
                        media_type: "REELS",
                        video_url: args.video_url,
                        caption: args.legenda
                    }
                });
                const containerId = container.data.id;
                
                // 2. Aguardar processamento (polling)
                let status = "IN_PROGRESS";
                let tentativas = 0;
                while (status === "IN_PROGRESS" && tentativas < 30) {
                    await new Promise(r => setTimeout(r, 5000));
                    const check = await axios.get(`https://graph.facebook.com/v19.0/${containerId}`, {
                        params: { access_token: META_TOKEN, fields: "status_code" }
                    });
                    status = check.data.status_code;
                    tentativas++;
                }
                if (status !== "FINISHED") return `Erro: Vídeo não processou (status: ${status})`;
                
                // 3. Publicar
                const pub = await axios.post(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`, null, {
                    params: { access_token: META_TOKEN, creation_id: containerId }
                });
                return `Reels publicado com sucesso! ID: ${pub.data.id}`;
            } catch (e) {
                return `Erro ao publicar Reels: ${e.response?.data?.error?.message || e.message}`;
            }
        }
        
        // Fluxo original para imagem e carrossel
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
        const fields = "reach,impressions,spend,cpc,cpm,ctr,actions";
        try {
            // Período atual
            const resAtual = await axios.get(url, {
                params: { access_token: META_TOKEN, fields, date_preset: args.date_preset, level: args.level || "campaign" }
            });
            
            // Comparativo automático: mapeia para o período anterior
            const presetMap = { today: "yesterday", last_7d: "last_14d", last_14d: "last_30d", last_30d: "last_90d" };
            const presetAnterior = presetMap[args.date_preset];
            let comparativo = null;
            
            if (presetAnterior) {
                try {
                    const resAnterior = await axios.get(url, {
                        params: { access_token: META_TOKEN, fields, date_preset: presetAnterior, level: args.level || "campaign" }
                    });
                    
                    // Calcula variação % para métricas principais
                    const atual = resAtual.data?.data?.[0] || {};
                    const anterior = resAnterior.data?.data?.[0] || {};
                    const calcVar = (a, b) => b && parseFloat(b) > 0 ? (((parseFloat(a || 0) - parseFloat(b)) / parseFloat(b)) * 100).toFixed(1) : "N/A";
                    
                    comparativo = {
                        periodo_comparado: presetAnterior,
                        variacao: {
                            spend: calcVar(atual.spend, anterior.spend) + "%",
                            cpc: calcVar(atual.cpc, anterior.cpc) + "%",
                            cpm: calcVar(atual.cpm, anterior.cpm) + "%",
                            ctr: calcVar(atual.ctr, anterior.ctr) + "%",
                            reach: calcVar(atual.reach, anterior.reach) + "%",
                            impressions: calcVar(atual.impressions, anterior.impressions) + "%"
                        }
                    };
                } catch (_) { /* falha silenciosa no comparativo */ }
            }
            
            return JSON.stringify({ periodo_atual: resAtual.data, comparativo });
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
    listar_posts_virais_instagram: async (numero, args) => {
        const META_TOKEN = process.env.META_ACCESS_TOKEN;
        const IG_USER_ID = "17841401666623403";
        const dias = args.dias || 7;
        try {
            const url = `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`;
            const res = await axios.get(url, {
                params: {
                    access_token: META_TOKEN,
                    fields: "id,caption,media_type,permalink,timestamp,comments_count,like_count",
                    limit: 50
                }
            });
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - dias);
            const recentes = res.data.data.filter(p => new Date(p.timestamp) >= dataLimite);
            
            // Busca métricas avançadas (reach, saved, shares) para cada post
            const postsComInsights = [];
            for (const p of recentes) {
                let reach = 0, saved = 0, shares = 0;
                try {
                    const insightsRes = await axios.get(`https://graph.facebook.com/v19.0/${p.id}/insights`, {
                        params: { access_token: META_TOKEN, metric: "reach,saved,shares" }
                    });
                    for (const m of insightsRes.data?.data || []) {
                        if (m.name === "reach") reach = m.values?.[0]?.value || 0;
                        if (m.name === "saved") saved = m.values?.[0]?.value || 0;
                        if (m.name === "shares") shares = m.values?.[0]?.value || 0;
                    }
                } catch (_) { /* insights podem falhar para alguns tipos de mídia */ }
                
                postsComInsights.push({
                    ...p,
                    reach, saved, shares,
                    engajamento: (p.like_count || 0) + (p.comments_count || 0) + saved + shares
                });
            }
            
            const top7 = postsComInsights.sort((a, b) => b.engajamento - a.engajamento).slice(0, 7);
            
            // Gera mini-relatório visual
            const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];
            let relatorio = `📊 *TOP ${top7.length} POSTS VIRAIS* (Últimos ${dias} dias)\n━━━━━━━━━━━━━━━━━━\n`;
            top7.forEach((p, i) => {
                const data = new Date(p.timestamp).toLocaleDateString("pt-BR");
                const texto = p.caption ? p.caption.substring(0, 60).replace(/\n/g, ' ') + '...' : 'Sem legenda';
                relatorio += `\n${medals[i]} *#${i+1}* | Score: ${p.engajamento}\n`;
                relatorio += `❤️ ${p.like_count || 0} | 💬 ${p.comments_count || 0} | 📌 ${p.saved} | 🔄 ${p.shares} | 👁️ ${p.reach}\n`;
                relatorio += `📅 ${data} | ${texto}\n`;
                relatorio += `🔗 ${p.permalink}\n`;
            });
            relatorio += `\n━━━━━━━━━━━━━━━━━━`;
            
            return relatorio;
        } catch (e) {
            return `Erro ao buscar posts virais: ${e.response?.data?.error?.message || e.message}`;
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
    },
    enviar_imagem_whatsapp: async (numero, args) => {
        try {
            // Usa o Gemini para gerar imagem a partir do prompt
            const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });
            const result = await imageModel.generateContent({
                contents: [{ role: "user", parts: [{ text: args.prompt + " professional, cinematic, 8k, no text." }] }],
                generationConfig: { responseModalities: ["IMAGE"] }
            });
            const part = result.response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                await enviarImagem(numero, part.inlineData.data, args.legenda || "🎨 Imagem gerada por IA");
                return "Imagem gerada e enviada com sucesso no grupo!";
            }
            return "Não foi possível gerar a imagem. Tente um prompt diferente.";
        } catch (e) {
            return `Erro ao gerar imagem: ${e.message}`;
        }
    },
    agendar_post_instagram: async (numero, args) => {
        const META_TOKEN = process.env.META_ACCESS_TOKEN;
        const IG_USER_ID = "17841401666623403";
        try {
            // Converte data/hora para timestamp Unix
            const scheduledTime = Math.floor(new Date(args.data_hora).getTime() / 1000);
            const agora = Math.floor(Date.now() / 1000);
            
            // A Meta exige que o agendamento seja entre 10min e 75 dias no futuro
            if (scheduledTime <= agora + 600) {
                return "Erro: O agendamento precisa ser pelo menos 10 minutos no futuro.";
            }
            
            // 1. Criar container de mídia
            const container = await axios.post(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media`, null, {
                params: {
                    access_token: META_TOKEN,
                    image_url: args.image_url,
                    caption: args.legenda
                }
            });
            
            // 2. Publicar com agendamento
            const pub = await axios.post(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`, null, {
                params: {
                    access_token: META_TOKEN,
                    creation_id: container.data.id,
                    scheduled_publish_time: scheduledTime
                }
            });
            
            const dataFormatada = new Date(args.data_hora).toLocaleString("pt-BR");
            return `📅 Post agendado com sucesso para ${dataFormatada}! ID: ${pub.data.id}`;
        } catch (e) {
            return `Erro ao agendar post: ${e.response?.data?.error?.message || e.message}`;
        }
    },
    buscar_tendencias: async (numero, args) => {
        try {
            const trendModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `Você é um analista de tendências de marketing digital. Pesquise e liste as 5 principais tendências ATUAIS (março de 2026) para o nicho "${args.nicho}"${args.plataforma ? ` na plataforma ${args.plataforma}` : ''}.

Para cada tendência, forneça:
1. Nome/Título da tendência
2. Por que está em alta agora
3. Uma ideia prática de conteúdo para aproveitar essa tendência
4. Hashtags relevantes (3-5)

Seja específico e atual. Foque em dados e exemplos reais.`;
            
            const result = await trendModel.generateContent(prompt);
            return result.response.text();
        } catch (e) {
            return `Erro ao buscar tendências: ${e.message}`;
        }
    }
};

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    try {
        const body = req.body;
        // Aceita tanto mensagens recebidas (MESSAGES_UPSERT) quanto mensagens enviadas por você (SEND_MESSAGE)
        if (!["messages.upsert", "MESSAGES_UPSERT", "send.message", "SEND_MESSAGE"].includes(body.event)) return;

        const data = body.data;
        
        // --- TRAVA DE SEGURANÇA: EXCLUSIVO PARA O QG DE PERFORMANCE ---
        const QG_PERFORMANCE_JID = "120363407547741321@g.us";
        const remoteJid = data?.key?.remoteJid || "";
        
        if (remoteJid !== QG_PERFORMANCE_JID) {
            // Ignora silenciosamente tudo que não for do grupo autorizado
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
        
        // Evita loop infinito: Se o texto contém o nosso espaço invisível, significa que o bot quem enviou esta mensagem
        if (texto && texto.includes("\u200B")) {
            return;
        }
        if (texto) content.push({ text: texto });

        // Áudio (Mágica Multimodal)
        const isAudio = data?.message?.audioMessage || data?.message?.pttMessage;
        
        // Evita que audios enviados pelo próprio bot causem loop (no futuro se o bot mandar áudio)
        // Atualmente ele só manda texto, mas se fromMe e não for áudio manual, ignoraremos
        // Vamos permitir audios fromMe pois o usuário pode mandar áudio do próprio celular
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
