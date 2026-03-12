import "dotenv/config";
import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const {
  EVOLUTION_URL,
  EVOLUTION_API_KEY,
  EVOLUTION_INSTANCE,
  GEMINI_API_KEY,
  PORT = 3000
} = process.env;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const AUTHORIZED_NUMBERS = ["558598372658", "558592494552"];

// Memória de contexto (Histórico de mensagens por número)
const historicoConversas = {};
const MAX_MENSAGENS = 20;

const evolutionApi = axios.create({
  baseURL: EVOLUTION_URL,
  headers: { "apikey": EVOLUTION_API_KEY }
});

async function enviarMensagem(to, text) {
  try {
    await evolutionApi.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
      number: to,
      text: text,
      delay: 1000
    });
  } catch (err) {
    console.error("Erro ao enviar:", err.response?.data || err.message);
  }
}

async function enviarPresence(to) {
  try {
    await evolutionApi.post(`/chat/sendPresence/${EVOLUTION_INSTANCE}`, {
      number: to,
      presence: "composing",
      delay: 0
    });
  } catch (e) {}
}

async function processarComIA(numero, texto) {
  if (!genAI) return "⚠️ Erro: GEMINI_API_KEY não configurada.";
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Recupera ou cria histórico para o número
    if (!historicoConversas[numero]) {
      historicoConversas[numero] = [];
    }

    const chat = model.startChat({
      history: historicoConversas[numero],
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(texto);
    const respostaString = result.response.text();

    // Atualiza o histórico local (limita a 20 mensagens/objetos)
    // O startChat consome o histórico no formato { role, parts: [{ text }] }
    historicoConversas[numero].push({ role: "user", parts: [{ text: texto }] });
    historicoConversas[numero].push({ role: "model", parts: [{ text: respostaString }] });

    // Se passar de 20 (10 turnos de pergunta/resposta), remove os mais antigos
    if (historicoConversas[numero].length > MAX_MENSAGENS) {
      historicoConversas[numero] = historicoConversas[numero].slice(-MAX_MENSAGENS);
    }

    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
    return `${respostaString}\n\n🕒 ${dataHora} (Memory Active)`;
  } catch (err) {
    console.error("Erro no Gemini:", err);
    return "❌ Erro na IA: " + err.message;
  }
}

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  if (!body.data || body.data.key?.fromMe) return;

  const remoteJid = body.data.key.remoteJid;
  if (remoteJid.includes("@g.us")) return; // Bloqueia grupos conforme pedido

  const numero = (body.data.key.participant || remoteJid).split('@')[0].split(':')[0];
  const texto = body.data.message?.conversation || body.data.message?.extendedTextMessage?.text;

  if (!texto || !AUTHORIZED_NUMBERS.includes(numero)) return;

  console.log(`📩 Mensagem de: ${numero} (Histórico: ${historicoConversas[numero]?.length || 0})`);
  await enviarPresence(remoteJid);
  
  const resposta = await processarComIA(numero, texto);
  
  // Quebrar em pedaços se for muito grande
  const chunks = resposta.match(/[\s\S]{1,3000}/g) || [];
  for (const chunk of chunks) {
    await enviarMensagem(remoteJid, chunk);
  }
});

app.get("/", (req, res) => res.json({ status: "online", memory: "enabled", limit: MAX_MENSAGENS }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor com MEMÓRIA rodando na porta ${PORT}`);
});
