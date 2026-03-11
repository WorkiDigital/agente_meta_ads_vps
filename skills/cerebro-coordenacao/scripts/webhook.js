import "dotenv/config";
import express from "express";
import axios from "axios";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { GoogleGenAI } from "@google/genai";

const app = express();
// Limite alto para evitar PayloadTooLargeError em sincronizações pesadas
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const PORT = process.env.PORT || 3000;
const WORK_DIR = process.env.WORK_DIR || process.cwd();
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "3500");
const CLAUDE_TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS || "300000");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Números pré-autorizados (sem precisar de senha)
const AUTHORIZED_NUMBERS = ["558598372658", "558592494552"];

const evolutionApi = axios.create({
  baseURL: EVOLUTION_URL,
  headers: { "apikey": EVOLUTION_API_KEY }
});

const usuariosAutorizados = {};
const sessoes = {};
const emProcessamento = new Set();

// Adiciona números pré-autorizados ao mapa
AUTHORIZED_NUMBERS.forEach(n => usuariosAutorizados[n] = "Usuário VIP");

/**
 * Envia mensagem via Evolution API
 */
async function enviarMensagem(to, text) {
  try {
    await evolutionApi.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
      number: to,
      text: text,
      delay: 1200,
      linkPreview: true
    });
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err.response?.data || err.message);
  }
}

/**
 * Envia imagem via Evolution API
 */
async function enviarImagem(to, base64, caption) {
  try {
    await evolutionApi.post(`/message/sendMedia/${EVOLUTION_INSTANCE}`, {
      number: to,
      media: base64,
      mediatype: "image",
      caption: caption,
      delay: 1200
    });
  } catch (err) {
    console.error("Erro ao enviar imagem:", err.response?.data || err.message);
  }
}

/**
 * Envia indicador de "digitando"
 */
async function enviarDigitando(to) {
  try {
    await evolutionApi.post(`/chat/sendPresence/${EVOLUTION_INSTANCE}`, {
      number: to,
      presence: "composing",
      delay: 0
    });
  } catch (err) {
    // Silencioso
  }
}

/**
 * Quebra texto longo em pedaços
 */
function quebrarEmChunks(texto, size) {
  const chunks = [];
  for (let i = 0; i < texto.length; i += size) {
    chunks.push(texto.substring(i, i + size));
  }
  return chunks;
}

/**
 * Detecta se o usuário quer gerar uma imagem
 */
function detectarPedidoImagem(texto) {
  const t = texto.toLowerCase();
  return t.includes("gerar imagem") || t.includes("crie uma imagem") || t.includes("gere uma imagem");
}

/**
 * Gera imagem via Gemini
 */
async function gerarImagem(prompt) {
  if (!genAI) return null;
  // Fallback implementado no DesignerService, aqui apenas chamamos a IA
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  // Nota: Gemini Pro não gera imagens diretamente aqui. 
  // O ideal é que o bot responda e os scripts de Skill façam o trabalho.
  return null; 
}

/**
 * Usa o Gemini 1.5 Pro para processar a mensagem e responder ou agir
 */
async function processarComIA(numero, texto) {
  if (!genAI) return "⚠️ Gemini API não configurada.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Contexto para o Agente saber quem é e o que pode fazer
    const prompt = `Você é o Agente Estrategista, um especialista em marketing digital e automação.
Seu objetivo é ajudar o usuário a gerenciar posts no Instagram e analisar métricas.
Você tem acesso a ferramentas de postagem (unico e carrossel) e relatórios de insights via scripts Node.js na VPS.

Usuário pediu: "${texto}"

Instruções:
- Se ele pedir para gerar um post novo, diga que você vai preparar o design e a copy.
- Se ele pedir relatórios, mencione que vai consultar os dados da Meta.
- Responda de forma curta e profissional.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Erro no Gemini:", err.message);
    return "❌ Erro ao processar com IA: " + err.message;
  }
}

// Middleware de log
app.use((req, res, next) => {
  if (req.path === "/webhook") {
    const preview = JSON.stringify(req.body || {}).substring(0, 150);
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${preview}`);
  }
  next();
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (!["messages.upsert", "MESSAGES_UPSERT"].includes(body.event)) return;

    const mensagem = body.data;
    if (mensagem?.key?.fromMe) return;

    const remoteJid = mensagem?.key?.remoteJid || "";
    if (remoteJid.includes("@g.us")) return; // Bloqueio de grupos conforme pedido

    const participant = mensagem?.key?.participant || remoteJid;
    const numero = participant.split('@')[0].split(':')[0];
    const destino = remoteJid;

    const texto = mensagem?.message?.conversation
      ?? mensagem?.message?.extendedTextMessage?.text;
    const nome = mensagem?.pushName || numero;

    if (!numero || !texto) return;

    console.log(`📩 De: ${numero} (${nome}) | No chat: ${destino}`);

    // Verifica autorização
    if (!usuariosAutorizados[numero]) {
       // Se não for autorizado, ignora completamente
       return;
    }

    const cmd = texto.trim().toLowerCase();

    // Guard para mensagens simultâneas
    if (emProcessamento.has(numero)) {
      await enviarMensagem(destino, "⏳ Aguarde, estou processando sua mensagem anterior...");
      return;
    }

    emProcessamento.add(numero);

    // Indicador de digitando
    const digitandoInterval = setInterval(() => enviarDigitando(destino), 20000);
    await enviarDigitando(destino);

    try {
      const inicio = Date.now();
      const resposta = await processarComIA(numero, texto);
      const duracao = ((Date.now() - inicio) / 1000).toFixed(1);

      console.log(`🤖 Resposta para ${nome} (${duracao}s): ${resposta.substring(0, 100)}`);

      const chunks = quebrarEmChunks(resposta, CHUNK_SIZE);

      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 500));
        await enviarMensagem(destino, chunks[i]);
      }
    } catch (err) {
      console.error(`❌ Erro ao processar mensagem de ${nome}:`, err.message);
      await enviarMensagem(destino, "❌ Ocorreu um erro ao processar sua mensagem.");
    } finally {
      clearInterval(digitandoInterval);
      emProcessamento.delete(numero);
    }

  } catch (err) {
    console.error("Erro no webhook:", err.message);
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    workDir: WORK_DIR,
    autorizados: AUTHORIZED_NUMBERS
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📁 Working directory: ${WORK_DIR}`);
  console.log(`🔑 Autorizados: ${AUTHORIZED_NUMBERS.join(", ")}`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/webhook`);
});
