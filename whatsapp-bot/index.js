import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

const BASE_URL = process.env.EVOLUTION_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "apikey": API_KEY,
    "Content-Type": "application/json"
  }
});

const server = new McpServer({
  name: "evolution-api",
  version: "1.0.0"
});

// Enviar mensagem de texto
server.tool(
  "enviar_mensagem",
  "Envia uma mensagem de texto pelo WhatsApp",
  {
    numero: z.string().describe("Número do destinatário com DDI (ex: 5511999999999)"),
    mensagem: z.string().describe("Texto da mensagem a enviar")
  },
  async ({ numero, mensagem }) => {
    const res = await api.post(`/message/sendText/${INSTANCE}`, {
      number: numero,
      text: mensagem
    });
    return {
      content: [{
        type: "text",
        text: `Mensagem enviada! ID: ${res.data?.key?.id ?? "ok"}`
      }]
    };
  }
);

// Buscar contatos
server.tool(
  "buscar_contatos",
  "Lista os contatos salvos no WhatsApp",
  {},
  async () => {
    const res = await api.get(`/contact/findContacts/${INSTANCE}`);
    const contatos = res.data?.slice(0, 20).map(c =>
      `${c.pushName ?? "Sem nome"} — ${c.id}`
    ).join("\n");
    return {
      content: [{
        type: "text",
        text: contatos || "Nenhum contato encontrado."
      }]
    };
  }
);

// Buscar conversas recentes
server.tool(
  "buscar_conversas",
  "Lista as conversas recentes do WhatsApp",
  {},
  async () => {
    const res = await api.get(`/chat/findChats/${INSTANCE}`);
    const chats = res.data?.slice(0, 15).map(c =>
      `${c.name ?? c.id} — última msg: ${new Date(c.lastMessageTimestamp * 1000).toLocaleString("pt-BR")}`
    ).join("\n");
    return {
      content: [{
        type: "text",
        text: chats || "Nenhuma conversa encontrada."
      }]
    };
  }
);

// Buscar mensagens de uma conversa
server.tool(
  "buscar_mensagens",
  "Busca as últimas mensagens de uma conversa",
  {
    numero: z.string().describe("Número do contato com DDI (ex: 5511999999999)"),
    quantidade: z.number().optional().describe("Quantidade de mensagens (padrão: 20)")
  },
  async ({ numero, quantidade = 20 }) => {
    const res = await api.post(`/chat/findMessages/${INSTANCE}`, {
      where: {
        key: {
          remoteJid: `${numero}@s.whatsapp.net`
        }
      },
      limit: quantidade
    });

    const msgs = res.data?.messages?.records ?? res.data ?? [];
    const texto = msgs.map(m => {
      const de = m.key?.fromMe ? "Você" : (m.pushName ?? numero);
      const conteudo = m.message?.conversation
        ?? m.message?.extendedTextMessage?.text
        ?? "[mídia]";
      const hora = new Date(m.messageTimestamp * 1000).toLocaleString("pt-BR");
      return `[${hora}] ${de}: ${conteudo}`;
    }).join("\n");

    return {
      content: [{
        type: "text",
        text: texto || "Nenhuma mensagem encontrada."
      }]
    };
  }
);

// Status da instância
server.tool(
  "status_instancia",
  "Verifica o status de conexão da instância do WhatsApp",
  {},
  async () => {
    const res = await api.get(`/instance/connectionState/${INSTANCE}`);
    const estado = res.data?.instance?.state ?? res.data?.state ?? JSON.stringify(res.data);
    return {
      content: [{
        type: "text",
        text: `Status da instância "${INSTANCE}": ${estado}`
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
