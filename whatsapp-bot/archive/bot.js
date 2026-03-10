import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync } from "fs";

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const genAI2 = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const api = axios.create({ baseURL: EVOLUTION_URL, headers: { apikey: EVOLUTION_API_KEY } });

const historicos = {};
const idsProcessados = new Set();
let inicializado = false;

async function enviarMensagem(jid, texto) {
  await api.post(`/message/sendText/${EVOLUTION_INSTANCE}`, { number: jid, text: texto });
}

async function enviarImagem(jid, base64, legenda) {
  await api.post(`/message/sendMedia/${EVOLUTION_INSTANCE}`, {
    number: jid,
    mediatype: "image",
    mimetype: "image/png",
    caption: legenda,
    media: base64,
  });
}

async function gerarImagem(prompt) {
  const resultado = await genAI2.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  for (const part of resultado.candidates[0].content.parts) {
    if (part.inlineData) return part.inlineData.data;
  }
  return null;
}

function detectarPedidoImagem(texto) {
  const t = texto.toLowerCase();
  return (
    t.includes("gerar imagem") ||
    t.includes("criar imagem") ||
    t.includes("gera imagem") ||
    t.includes("cria imagem") ||
    t.includes("me manda uma imagem") ||
    t.includes("desenha") ||
    t.includes("ilustra")
  );
}

async function perguntarGemini(jid, nome, mensagem) {
  if (!historicos[jid]) historicos[jid] = [];
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: `Você é um assistente prestativo via WhatsApp. Conversando com ${nome}. Seja direto, use português do Brasil.` });
  const chat = model.startChat({ history: historicos[jid] });
  const resultado = await chat.sendMessage(mensagem);
  const resposta = resultado.response.text();
  historicos[jid].push({ role: "user", parts: [{ text: mensagem }] });
  historicos[jid].push({ role: "model", parts: [{ text: resposta }] });
  if (historicos[jid].length > 40) historicos[jid] = historicos[jid].slice(-40);
  return resposta;
}

async function checarMensagens() {
  try {
    const res = await api.post(`/chat/findMessages/${EVOLUTION_INSTANCE}`, { count: 20 });
    const mensagens = res.data?.messages?.records || [];

    // Primeira execução: marca todas existentes como já processadas
    if (!inicializado) {
      for (const msg of mensagens) idsProcessados.add(msg.id);
      inicializado = true;
      console.log(`✅ ${idsProcessados.size} mensagens antigas ignoradas. Aguardando novas...`);
      return;
    }

    for (const msg of [...mensagens].reverse()) {
      if (idsProcessados.has(msg.id)) continue;
      idsProcessados.add(msg.id);

      if (msg.key?.fromMe) continue;
      if (msg.key?.remoteJid?.includes("@g.us")) continue;

      const jid = msg.key?.remoteJid;
      const texto = msg.message?.conversation ?? msg.message?.extendedTextMessage?.text;
      const nome = msg.pushName || jid;
      const temImagem = msg.message?.imageMessage;

      if (!jid) continue;

      // Recebeu imagem — baixa e salva no PC
      if (temImagem) {
        console.log(`🖼️ Imagem recebida de ${nome}, baixando...`);
        try {
          const res = await api.post(`/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`, { message: msg, convertToMp4: false });
          const base64 = res.data?.base64;
          if (base64) {
            mkdirSync("fotos", { recursive: true });
            const arquivo = `fotos/foto-${Date.now()}.jpg`;
            writeFileSync(arquivo, Buffer.from(base64, "base64"));
            console.log(`✅ Foto salva em: ${arquivo}`);
            await enviarMensagem(jid, `✅ Foto salva no PC como \`${arquivo}\`! Pode usar para o carousel.`);
          }
        } catch (err) {
          console.error("Erro ao baixar imagem:", err.message);
          await enviarMensagem(jid, "Não consegui salvar a foto. Tenta de novo.");
        }
        continue;
      }

      if (!texto) continue;

      console.log(`📩 ${nome}: ${texto}`);

      if (detectarPedidoImagem(texto)) {
        console.log(`🎨 Gerando imagem para: ${texto}`);
        await enviarMensagem(jid, "🎨 Gerando sua imagem, aguarde...");
        const base64 = await gerarImagem(texto);
        if (base64) {
          await enviarImagem(jid, base64, texto);
          console.log(`🖼️ Imagem enviada para ${nome}`);
        } else {
          await enviarMensagem(jid, "Não consegui gerar a imagem. Tente descrever melhor.");
        }
      } else {
        const resposta = await perguntarGemini(jid, nome, texto);
        console.log(`🤖 Respondendo: ${resposta.substring(0, 80)}`);
        await enviarMensagem(jid, resposta);
      }
    }
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

console.log("🤖 Bot iniciado — verificando mensagens a cada 3 segundos...");
setInterval(checarMensagens, 3000);
