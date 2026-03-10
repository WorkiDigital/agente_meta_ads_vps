import { spawn } from "child_process";
import { fileURLToPath } from "url";
import axios from "axios";

const EVOLUTION_URL = process.env.EVOLUTION_URL || "https://painelevo.workidigital.tech";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "6A856829-3869-46DD-8223-C209C6780B48";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "claude-code";
const WORK_DIR = process.env.WORK_DIR || "C:\\Users\\Samsung";
const PORT = process.env.PORT || 3000;
const CLOUDFLARED_BIN = process.env.CLOUDFLARED_BIN || "C:\\Users\\Samsung\\AppData\\Roaming\\npm\\cloudflared.cmd";

let webhookProc = null;
let tunnelProc = null;

async function atualizarWebhook(url) {
  try {
    await axios.post(
      `${EVOLUTION_URL}/webhook/set/${EVOLUTION_INSTANCE}`,
      {
        webhook: {
          enabled: true,
          url: `${url}/webhook`,
          webhook_by_events: false,
          webhook_base64: false,
          events: ["MESSAGES_UPSERT"]
        }
      },
      { headers: { apikey: EVOLUTION_API_KEY, "Content-Type": "application/json" } }
    );
    console.log(`\n✅ Webhook atualizado: ${url}/webhook\n`);
  } catch (e) {
    console.error("❌ Erro ao atualizar webhook:", e.message);
  }
}

function iniciarWebhook() {
  console.log("[webhook] Iniciando servidor...");

  const env = {
    ...process.env,
    EVOLUTION_URL,
    EVOLUTION_API_KEY,
    EVOLUTION_INSTANCE,
    WORK_DIR,
    PORT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
  };

  webhookProc = spawn(process.execPath, ["webhook.js"], {
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    env,
    stdio: "inherit"
  });

  webhookProc.on("close", (code) => {
    console.log(`[webhook] Encerrou (${code}). Reiniciando em 3s...`);
    setTimeout(iniciarWebhook, 3000);
  });
}

function iniciarTunnel() {
  console.log("[tunnel] Iniciando cloudflared...");

  tunnelProc = spawn(CLOUDFLARED_BIN, ["tunnel", "--url", `http://localhost:${PORT}`], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  tunnelProc.stdout.setEncoding("utf8");
  tunnelProc.stderr.setEncoding("utf8");

  const capturarUrl = (data) => {
    const match = data.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      atualizarWebhook(match[0]);
    }
  };

  tunnelProc.stdout.on("data", capturarUrl);
  tunnelProc.stderr.on("data", (data) => {
    capturarUrl(data);
    if (data.includes("ERR") && !data.includes("Unable to reach")) {
      process.stdout.write(`[tunnel] ${data}`);
    }
  });

  tunnelProc.on("close", (code) => {
    console.log(`[tunnel] Encerrou (${code}). Reiniciando em 5s...`);
    setTimeout(iniciarTunnel, 5000);
  });
}

// Encerramento limpo
process.on("SIGINT", () => {
  console.log("\n🛑 Encerrando...");
  webhookProc?.kill();
  tunnelProc?.kill();
  process.exit(0);
});

// Inicia tudo
console.log("🚀 Iniciando Claude Code no WhatsApp...");
console.log(`📁 Working dir: ${WORK_DIR}`);
console.log(`🔗 Instância: ${EVOLUTION_INSTANCE}\n`);

// Webhook primeiro, tunnel depois de 2s (dar tempo pro servidor subir)
iniciarWebhook();
setTimeout(iniciarTunnel, 2000);
