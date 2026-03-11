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
    const prompt = `Você é o Agente Estrategista da WorkiDigital. 
Ajude o usuário com marketing e posts. 
Ele disse: "${texto}"
Responda de forma curta e objetiva.`;
    
    const result = await model.generateContent(prompt);
    const resposta = result.response.text();
    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
    
    return `${resposta}\n\n🕒 ${dataHora} (V2)`;
  } catch (err) {
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

  console.log(`📩 Mensagem de: ${numero}`);
  await enviarPresence(remoteJid);
  
  const resposta = await processarComIA(numero, texto);
  
  // Quebrar em pedaços se for muito grande
  const chunks = resposta.match(/[\s\S]{1,3000}/g) || [];
  for (const chunk of chunks) {
    await enviarMensagem(remoteJid, chunk);
  }
});

app.get("/", (req, res) => res.send("Bot Online 🚀"));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
