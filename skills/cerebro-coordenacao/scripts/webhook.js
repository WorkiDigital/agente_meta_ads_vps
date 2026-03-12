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

/**
 * Usa o Gemini para transformar o pedido em um JSON de Carrossel
 */
async function gerarJsonCarrossel(promptUsuario) {
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const systemPrompt = `Transforme o pedido de carrossel do usuário em um JSON estruturado.
FORMATO:
{
  "tipo": "carrossel",
  "pasta_destino": "nome-unico",
  "tema": "Titulo do Post",
  "slides": [
    { "texto": "texto do slide", "promptImagem": "prompt detalhado para imagem", "nome_arquivo": "slide1.jpg" }
  ]
}
Gere prompts de imagem detalhados e técnicos (fotorealista, 4k, estilo premium).
Retorne APENAS o JSON, sem markdown.`;

  try {
    const result = await model.generateContent(`${systemPrompt}\n\nPedido: ${promptUsuario}`);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Erro ao gerar JSON:", e);
    return null;
  }
}

async function processarComIA(numero, texto, remoteJid) {
  if (!genAI) return "⚠️ Gemini API não configurada.";
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    if (!historicoConversas[numero]) historicoConversas[numero] = [];

    const chat = model.startChat({ history: historicoConversas[numero] });

    const systemContext = `Você é o Agente Estrategista.
FERRAMENTAS:
- [TRIGGER:CARROSSEL]: Use quando o usuário confirmar que quer criar as artes/cards de um carrossel.
Diga que está iniciando a produção.`;

    const result = await chat.sendMessage(`${systemContext}\n\nUsuário: ${texto}`);
    const respostaString = result.response.text();

    historicoConversas[numero].push({ role: "user", parts: [{ text: texto }] });
    historicoConversas[numero].push({ role: "model", parts: [{ text: respostaString }] });

    if (historicoConversas[numero].length > MAX_MENSAGENS) {
      historicoConversas[numero] = historicoConversas[numero].slice(-MAX_MENSAGENS);
    }

    if (respostaString.includes("[TRIGGER:CARROSSEL]")) {
      await enviarMensagem(remoteJid, "🎨 Convertendo seu conteúdo em design... Aguarde.");
      
      const configJson = await gerarJsonCarrossel(texto);
      if (configJson) {
        await enviarMensagem(remoteJid, "✨ JSON de Design gerado! Iniciando renderização das imagens...");
        
        try {
          const { code, output } = await executarSkill("skills/design-visual/scripts/gerar-post-premium.mjs", ["--json", JSON.stringify(configJson)]);
          if (code === 0) {
            await enviarMensagem(remoteJid, `✅ Artes geradas com sucesso!\n\n${output.substring(0, 500)}`);
          } else {
            await enviarMensagem(remoteJid, "❌ Houve um erro na renderização das artes.");
          }
        } catch (e) {
          await enviarMensagem(remoteJid, "❌ Falha crítica na execução da Skill: " + e.message);
        }
      } else {
        await enviarMensagem(remoteJid, "❌ Não consegui estruturar o conteúdo do carrossel.");
      }
    }

    if (respostaString.includes("[TRIGGER:INSIGHTS]")) {
      await enviarMensagem(remoteJid, "📊 Consultando seus dados na Meta... Aguarde um instante.");
      try {
        const { code, output } = await executarSkill("skills/ads-insights/scripts/fast_report.mjs");
        if (code === 0) {
          await enviarMensagem(remoteJid, output);
        } else {
          await enviarMensagem(remoteJid, "❌ Erro ao gerar o relatório de insights.");
        }
      } catch (e) {
        await enviarMensagem(remoteJid, "❌ Falha ao conectar com a Meta: " + e.message);
      }
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
    if (chunk) await enviarMensagem(remoteJid, chunk);
  }
});

app.get("/", (req, res) => res.json({ status: "online", tools: ["carrossel"] }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor de AÇÃO V2 rodando na porta ${PORT}`);
});
