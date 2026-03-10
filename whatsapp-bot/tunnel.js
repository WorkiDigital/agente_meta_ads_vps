import { exec } from "child_process";
import axios from "axios";

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

async function atualizarWebhook(url) {
  try {
    const res = await axios.post(
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
    console.log(`[tunnel] Webhook atualizado: ${url}/webhook`);
  } catch (e) {
    console.error("[tunnel] Erro ao atualizar webhook:", e.message);
  }
}

function iniciarTunnel() {
  console.log("[tunnel] Iniciando localtunnel...");
  const proc = exec("npx localtunnel --port 3000");

  proc.stdout.on("data", (data) => {
    const match = data.match(/your url is: (https:\/\/\S+)/);
    if (match) {
      const url = match[1].trim();
      console.log(`[tunnel] URL: ${url}`);
      atualizarWebhook(url);
    }
  });

  proc.stderr.on("data", (data) => {
    console.error("[tunnel] stderr:", data.trim());
  });

  proc.on("close", (code) => {
    console.log(`[tunnel] Processo encerrou (${code}). Reiniciando em 3s...`);
    setTimeout(iniciarTunnel, 3000);
  });
}

iniciarTunnel();
