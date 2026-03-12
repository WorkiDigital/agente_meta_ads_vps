import "dotenv/config";
import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { spawn } from "child_process";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const {
  EVOLUTION_URL,
  EVOLUTION_API_KEY,
  EVOLUTION_INSTANCE,
  GEMINI_API_KEY,
  PORT = 3000,
  WORK_DIR = process.cwd()
} = process.env;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const AUTHORIZED_NUMBERS = ["558598372658", "558592494552"];

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

/**
 * Função para executar scripts de Skills na VPS
 */
function executarSkill(scriptPath, args = []) {
  return new Promise((resolve) => {
    console.log(`🚀 Executando Skill: node ${scriptPath} ${args.join(" ")}`);
    const child = spawn("node", [scriptPath, ...args], { cwd: WORK_DIR });
    
    let output = "";
    child.stdout.on("data", (data) => output += data.toString());
    child.stderr.on("data", (data) => console.error(`[Skill Error] ${data}`));
    
    child.on("close", (code) => {
      resolve({ code, output });
    });
  });
}

async function processarComIA(numero, texto, remoteJid) {
  if (!genAI) return "⚠️ Gemini API não configurada.";
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    if (!historicoConversas[numero]) historicoConversas[numero] = [];

    const chat = model.startChat({
      history: historicoConversas[numero],
    });

    const systemContext = `Você é o Agente Estrategista. Seu objetivo é ajudar o usuário e EXECUTAR ferramentas quando solicitado.
FERRAMENTAS DISPONÍVEIS:
1. Criar Carrossel: Se o usuário mandar lâminas ou pedir para criar artes de carrossel, responda confirmando e adicione a tag [TRIGGER:CARROSSEL] no fim da resposta.
2. Ver Relatórios: Se pedir insights ou métricas, responda e adicione [TRIGGER:INSIGHTS].

Peça desculpas se falhou antes e diga que agora vai executar.`;

    const result = await chat.sendMessage(`${systemContext}\n\nUsuário: ${texto}`);
    const respostaString = result.response.text();

    historicoConversas[numero].push({ role: "user", parts: [{ text: texto }] });
    historicoConversas[numero].push({ role: "model", parts: [{ text: respostaString }] });

    if (historicoConversas[numero].length > MAX_MENSAGENS) {
      historicoConversas[numero] = historicoConversas[numero].slice(-MAX_MENSAGENS);
    }

    // Lógica de Gatilho (Trigger)
    if (respostaString.includes("[TRIGGER:CARROSSEL]")) {
      await enviarMensagem(remoteJid, "🎨 Iniciando a geração das artes do carrossel agora mesmo... Isso pode levar alguns segundos.");
      // Aqui dispararíamos o script de carrossel. Por enquanto vamos simular a chamada
      // Nota: No próximo passo vamos conectar o JSON do carrossel ao script real.
      executarSkill("skills/design-visual/scripts/gerar-post-premium.mjs", ["--prompt", texto]);
    }

    const dataHora = new Date().toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
    return `${respostaString.replace(/\[TRIGGER:.*\]/g, "")}\n\n🕒 ${dataHora} (Action Mode ON)`;
  } catch (err) {
    return "❌ Erro na IA: " + err.message;
  }
}

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  const body = req.body;
  if (!body.data || body.data.key?.fromMe) return;

  const remoteJid = body.data.key.remoteJid;
  if (remoteJid.includes("@g.us")) return;

  const numero = (body.data.key.participant || remoteJid).split('@')[0].split(':')[0];
  const texto = body.data.message?.conversation || body.data.message?.extendedTextMessage?.text;

  if (!texto || !AUTHORIZED_NUMBERS.includes(numero)) return;

  await enviarPresence(remoteJid);
  const resposta = await processarComIA(numero, texto, remoteJid);
  
  const chunks = resposta.match(/[\s\S]{1,3000}/g) || [];
  for (const chunk of chunks) {
    await enviarMensagem(remoteJid, chunk);
  }
});

app.get("/", (req, res) => res.json({ status: "online", mode: "action" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor de AÇÃO rodando na porta ${PORT}`);
});
