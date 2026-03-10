import axios from "axios";
import { writeFileSync, mkdirSync } from "fs";

const api = axios.create({ baseURL: process.env.EVOLUTION_URL, headers: { apikey: process.env.EVOLUTION_API_KEY } });
const res = await api.post(`/chat/findMessages/${process.env.EVOLUTION_INSTANCE}`, { count: 20 });
const msgs = res.data?.messages?.records || [];

mkdirSync("fotos", { recursive: true });

let count = 0;
for (const m of msgs) {
  if (m.message?.imageMessage && !m.key?.fromMe) {
    try {
      const dl = await api.post(`/chat/getBase64FromMediaMessage/${process.env.EVOLUTION_INSTANCE}`, { message: m, convertToMp4: false });
      const base64 = dl.data?.base64;
      if (base64) {
        const arquivo = `fotos/foto-${m.messageTimestamp}-${count}.jpg`;
        writeFileSync(arquivo, Buffer.from(base64, "base64"));
        console.log("✅ Salva:", arquivo);
        count++;
      }
    } catch(e) {
      console.error("Erro:", e.message);
    }
  }
}
console.log(`Total: ${count} fotos salvas`);
