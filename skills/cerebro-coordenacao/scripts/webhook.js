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
const CLAUDE_BIN = process.env.CLAUDE_BIN || "C:\\Users\\Samsung\\.local\\bin\\claude.exe";
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "3500");
const CLAUDE_TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS || "300000");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Números pré-autorizados (sem precisar de senha)
const AUTHORIZED_NUMBERS = ["558598372658", "558592494552"];

const evolutionApi = axios.create({
  baseURL: EVOLUTION_URL,
  headers: {
    "apikey": EVOLUTION_API_KEY,
    "Content-Type": "application/json"
  }
});

// Estado em memória
const usuariosAutorizados = {}; // { numero: nome }
const sessoes = {};             // { numero: uuid } — session-id do Claude Code
const emProcessamento = new Set();

// Inicializa autorizados pré-definidos
for (const n of AUTHORIZED_NUMBERS) {
  usuariosAutorizados[n] = n;
}

function detectarPedidoImagem(texto) {
  const t = texto.toLowerCase();
  return (
    t.includes("gerar imagem") || t.includes("criar imagem") ||
    t.includes("gera imagem") || t.includes("cria imagem") ||
    t.includes("me manda uma imagem") || t.includes("desenha") ||
    t.includes("ilustra") || t.includes("gere uma imagem") ||
    t.includes("crie uma imagem")
  );
}

async function gerarImagem(prompt) {
  const resultado = await genAI.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseModalities: ["TEXT", "IMAGE"] },
  });
  for (const part of resultado.candidates[0].content.parts) {
    if (part.inlineData) return part.inlineData.data;
  }
  return null;
}

async function enviarImagem(numero, base64, legenda) {
  try {
    await evolutionApi.post(`/message/sendMedia/${EVOLUTION_INSTANCE}`, {
      number: numero,
      mediatype: "image",
      mimetype: "image/png",
      caption: legenda,
      media: base64,
    });
  } catch (e) {
    console.error("Erro ao enviar imagem:", e.message);
  }
}

async function enviarMensagem(numero, texto) {
  try {
    await evolutionApi.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
      number: numero,
      text: texto
    });
  } catch (e) {
    console.error("Erro ao enviar msg:", e.message);
  }
}

async function enviarDigitando(numero) {
  try {
    await evolutionApi.post(`/chat/sendPresence/${EVOLUTION_INSTANCE}`, {
      number: `${numero}@s.whatsapp.net`,
      options: { presence: "composing", delay: 1200 }
    });
  } catch (_) {
    // presença é opcional, não bloqueia
  }
}

function quebrarEmChunks(texto, limite) {
  if (texto.length <= limite) return [texto];

  const chunks = [];
  let restante = texto;

  while (restante.length > 0) {
    if (restante.length <= limite) {
      chunks.push(restante);
      break;
    }

    let corte = restante.lastIndexOf("\n\n", limite);
    if (corte < limite * 0.5) corte = restante.lastIndexOf("\n", limite);
    if (corte < limite * 0.3) corte = restante.lastIndexOf(" ", limite);
    if (corte <= 0) corte = limite;

    chunks.push(restante.slice(0, corte).trim());
    restante = restante.slice(corte).trim();
  }

  return chunks.filter(c => c.length > 0);
}

async function executarClaudeCode(numero, mensagem) {
  const env = { ...process.env };
  delete env.CLAUDECODE;

  const args = [
    "--print",
    "--dangerously-skip-permissions",
    "--output-format", "text"
  ];

  // Usar session existente ou criar nova
  if (sessoes[numero]) {
    args.push("--resume", sessoes[numero]);
  } else {
    const novoId = randomUUID();
    sessoes[numero] = novoId;
    args.push("--session-id", novoId);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_BIN, args, {
      env,
      cwd: WORK_DIR,
      stdio: ["pipe", "pipe", "pipe"]
    });

    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");

    let output = "";
    let erro = "";

    proc.stdin.write(mensagem);
    proc.stdin.end();

    proc.stdout.on("data", (d) => output += d);
    proc.stderr.on("data", (d) => erro += d);

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("Timeout"));
    }, CLAUDE_TIMEOUT_MS);

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else if (output.trim()) {
        // saiu com erro mas tem output — retorna mesmo assim
        resolve(output.trim());
      } else {
        // sessão pode ter expirado, tentar sem --resume
        if (erro.includes("session") || erro.includes("resume")) {
          delete sessoes[numero];
        }
        reject(new Error(erro.slice(0, 200) || `Saiu com código ${code}`));
      }
    });
  });
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

    // Suporte ao novo formato @lid do WhatsApp
    const participant = mensagem?.key?.participant || remoteJid;

    // Extração robusta do número (remove sufixos e domínios)
    const numero = participant.split('@')[0].split(':')[0];
    const destino = remoteJid;

    const texto = mensagem?.message?.conversation
      ?? mensagem?.message?.extendedTextMessage?.text;
    const nome = mensagem?.pushName || numero;

    if (!numero || !texto) return;

    console.log(`📩 De: ${numero} (${nome}) | No chat: ${destino}`);

    const cmd = texto.trim().toLowerCase();

    // Ativação por senha
    if (cmd === "wrkcode") {
      usuariosAutorizados[numero] = nome;
      await enviarMensagem(numero, `✅ Olá, ${nome}! Acesso liberado. Pode enviar seus comandos.`);
      return;
    }

    if (!usuariosAutorizados[numero]) {
      console.log(`🚫 Não autorizado: ${nome} (${numero})`);
      return;
    }

    // Comandos especiais
    if (cmd === "sair" || cmd === "logout") {
      delete usuariosAutorizados[numero];
      delete sessoes[numero];
      await enviarMensagem(numero, "👋 Acesso encerrado. Envie *wrkcode* para voltar.");
      return;
    }

    if (cmd === "nova conversa") {
      delete sessoes[numero];
      await enviarMensagem(numero, "🔄 Nova conversa iniciada. Qual é seu primeiro comando?");
      return;
    }

    if (cmd === "status") {
      const temSessao = !!sessoes[numero];
      const msg = temSessao
        ? `🟢 Sessão ativa\nID: ...${sessoes[numero].slice(-8)}\nPasta: ${WORK_DIR}`
        : `🟡 Sem sessão ativa ainda\nPasta: ${WORK_DIR}`;
      await enviarMensagem(numero, msg);
      return;
    }

    // Geração de imagem via Gemini
    if (genAI && detectarPedidoImagem(texto)) {
      await enviarMensagem(numero, "🎨 Gerando sua imagem, aguarde...");
      try {
        const base64 = await gerarImagem(texto);
        if (base64) {
          await enviarImagem(numero, base64, texto);
          console.log(`🖼️ Imagem enviada para ${numero}`);
        } else {
          await enviarMensagem(numero, "Não consegui gerar a imagem. Tente descrever melhor.");
        }
      } catch (err) {
        console.error("Erro ao gerar imagem:", err.message);
        await enviarMensagem(numero, "❌ Erro ao gerar imagem. Tente novamente.");
      }
      return;
    }

    // Guard para mensagens simultâneas
    if (emProcessamento.has(numero)) {
      await enviarMensagem(numero, "⏳ Aguarde, ainda estou processando sua mensagem anterior...");
      return;
    }

    emProcessamento.add(numero);

    // Indicador de digitando
    const digitandoInterval = setInterval(() => enviarDigitando(numero), 20000);
    await enviarDigitando(numero);

    try {
      const inicio = Date.now();
      const resposta = await executarClaudeCode(numero, texto);
      const duracao = ((Date.now() - inicio) / 1000).toFixed(1);

      console.log(`🤖 Resposta para ${nome} (${duracao}s): ${resposta.substring(0, 100)}`);

      const chunks = quebrarEmChunks(resposta, CHUNK_SIZE);

      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 500));
        await enviarMensagem(numero, chunks[i]);
      }
    } catch (err) {
      console.error(`❌ Erro ao processar mensagem de ${nome}:`, err.message);

      let msgErro = "❌ Ocorreu um erro ao processar sua mensagem.";
      if (err.message === "Timeout") {
        msgErro = `⏱️ A operação demorou mais de ${CLAUDE_TIMEOUT_MS / 60000} minutos. Tente um comando mais simples.`;
      } else if (err.message.includes("auth")) {
        msgErro = "🔐 Erro de autenticação do Claude Code. Verifique a configuração.";
      }

      await enviarMensagem(numero, msgErro);
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
    autorizados: Object.keys(usuariosAutorizados).length,
    sessoesAtivas: Object.keys(sessoes).length
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📁 Working directory: ${WORK_DIR}`);
  console.log(`🔑 Autorizados: ${AUTHORIZED_NUMBERS.join(", ")}`);
  console.log(`🔗 Webhook: http://localhost:${PORT}/webhook`);
});
