import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

if (!EVOLUTION_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.error("Faltam variáveis de ambiente da Evolution API no .env");
    process.exit(1);
}

const api = axios.create({
    baseURL: EVOLUTION_URL,
    headers: {
        apikey: EVOLUTION_API_KEY,
        "Content-Type": "application/json",
    },
});

const server = new Server(
    {
        name: "evolution-api-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "enviar_mensagem",
                description: "Envia uma mensagem de texto simples via WhatsApp para um número.",
                inputSchema: {
                    type: "object",
                    properties: {
                        numero: { type: "string", description: "Número no formato DDI+DDD+NUMERO (ex: 5511999999999)" },
                        mensagem: { type: "string", description: "Texto da mensagem a ser enviada" }
                    },
                    required: ["numero", "mensagem"]
                }
            },
            {
                name: "buscar_conversas",
                description: "Busca as conversas/chats recentes da instância do WhatsApp",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "status_instancia",
                description: "Verifica se a instância de WhatsApp está conectada",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ]
    };
});

// Implement Tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};

    try {
        if (toolName === "enviar_mensagem") {
            const { numero, mensagem } = args as any;
            const response = await api.post(`/message/sendText/${EVOLUTION_INSTANCE}`, {
                number: numero,
                text: mensagem,
            });
            return { content: [{ type: "text", text: `Mensagem enviada com sucesso: ${JSON.stringify(response.data)}` }] };
        }

        if (toolName === "buscar_conversas") {
            const response = await api.get(`/chat/findChats/${EVOLUTION_INSTANCE}`);
            return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
        }

        if (toolName === "status_instancia") {
            const response = await api.get(`/instance/connectionState/${EVOLUTION_INSTANCE}`);
            return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
        }

        throw new Error(`Tool unknown: ${toolName}`);
    } catch (error: any) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        return {
            content: [{ type: "text", text: `Erro ao executar ${toolName}: ${errorMsg}` }],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Evolution API MCP Server is running on stdio");
}

runServer().catch(console.error);
