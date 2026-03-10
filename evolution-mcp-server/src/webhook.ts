import express from "express";
import axios from "axios";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY || !EVOLUTION_URL) {
    console.error("Variáveis de ambiente incompletas (GEMINI, EVOLUTION)");
    process.exit(1);
}

// Inicia o SDK oficial do Google Gen AI
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const chatHistory = new Map<string, any[]>();

const evoApi = axios.create({
    baseURL: EVOLUTION_URL,
    headers: { apikey: EVOLUTION_API_KEY, "Content-Type": "application/json" }
});

app.post("/webhook", async (req, res) => {
    try {
        const { body } = req;

        // Processamos apenas eventos do tipo mensagens novas
        if (body.event === "messages.upsert") {
            const messageData = body.data;

            // Ignorar mensagens minhas, do sistema ou de grupos
            if (
                messageData.key.fromMe ||
                messageData.key.remoteJid.includes("@g.us") ||
                messageData.key.remoteJid === "status@broadcast"
            ) {
                return res.status(200).send("Ignored");
            }

            const remoteJid = messageData.key.remoteJid;
            // Extrai o texto da mensagem (suporta texto puro ou texto extendido)
            const textMessage = messageData.message?.conversation ||
                messageData.message?.extendedTextMessage?.text;

            if (!textMessage) return res.status(200).send("Not a text message");

            console.log(`[WhatsApp] Recebido de ${remoteJid}: ${textMessage}`);

            // Gerencia o histórico na memória para contexto (limite de 20 mensagens)
            if (!chatHistory.has(remoteJid)) {
                chatHistory.set(remoteJid, []);
            }
            const history = chatHistory.get(remoteJid)!;
            history.push({ role: "user", parts: [{ text: textMessage }] });

            if (history.length > 20) history.shift();

            // Chamada para a API do Gemini
            const aiResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { role: "user", parts: [{ text: "Atue como um assistente super prestativo via WhatsApp. Responda de forma natural, curta e direta, sem pular linhas de forma robótica. Eis a mensagem que acabou de chegar do usuário:" }] },
                    ...history
                ]
            });

            const replyText = aiResponse.text;
            if (replyText) {
                console.log(`[AI] Respondendo para ${remoteJid}: ${replyText}`);

                // Salvando nossa resposta no histórico
                history.push({ role: "model", parts: [{ text: replyText }] });

                // Enviando de volta pro WA usando Evolution
                await evoApi.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
                    number: remoteJid.replace("@s.whatsapp.net", ""),
                    text: replyText
                });
            }
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Erro processando webhook:", error);
        res.status(500).send("Error");
    }
});

app.listen(PORT, () => {
    console.log(`[Webhook] Servidor ouvindo na porta ${PORT}`);
});
