import { spawn } from "child_process";
import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3000;
const CLOUDFLARED_BIN = process.env.CLOUDFLARED_BIN || "cloudflared";
const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

if (!EVOLUTION_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.error("Variáveis de ambiente incompletas (EVOLUTION)");
    process.exit(1);
}

const evoApi = axios.create({
    baseURL: EVOLUTION_URL,
    headers: { apikey: EVOLUTION_API_KEY, "Content-Type": "application/json" }
});

let publicUrl = "";

async function updateWebhook(url: string) {
    try {
        console.log(`[Start] Atualizando Webhook na Evolution para: ${url}/webhook`);
        await evoApi.post(`/webhook/set/${EVOLUTION_INSTANCE}`, {
            webhook: {
                url: `${url}/webhook`,
                byEvents: false,
                base64: false,
                events: ["MESSAGES_UPSERT"]
            }
        });
        console.log("[Start] Webhook configurado com sucesso na Evolution!");
    } catch (error: any) {
        console.error("[Start] Erro ao configurar webhook:", error.response?.data || error.message);
    }
}

function startWebhookServer() {
    console.log("[Start] Iniciando servidor Webhook (Express)...");
    // Assume que ts-node está sendo usado ou que será compilado no build
    const webhookProc = spawn("node", ["build/webhook.js"], { stdio: "inherit" });

    webhookProc.on("close", (code) => {
        console.log(`[Start] Webhook server morreu com código ${code}. Reiniciando em 3s...`);
        setTimeout(startWebhookServer, 3000);
    });
}

function startCloudflared() {
    console.log(`[Start] Iniciando túnel Cloudflared na porta ${PORT}...`);
    const tunnelProc = spawn(CLOUDFLARED_BIN, ["tunnel", "--url", `http://localhost:${PORT}`]);

    tunnelProc.stderr.on("data", (data) => {
        const output = data.toString();
        // Procura no log do Cloudflared a URL pública gerada
        const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && match[0] !== publicUrl) {
            publicUrl = match[0];
            console.log(`[Start] Nova URL Pública (Cloudflared): ${publicUrl}`);
            updateWebhook(publicUrl);
        }
    });

    tunnelProc.on("close", (code) => {
        console.log(`[Start] Cloudflared morreu com código ${code}. Reiniciando em 3s...`);
        setTimeout(startCloudflared, 3000);
    });
}

// Inicialização Principal
console.log("=== INICIANDO SISTEMA EVOLUTION WHATSAPP ===");
startWebhookServer();

setTimeout(() => {
    startCloudflared();
}, 2000);
