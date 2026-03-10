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

const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
const API_VERSION = process.env.META_API_VERSION || "v19.0";

if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    console.error("INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_USER_ID não encontrado no .env");
    process.exit(1);
}

const META_API_BASE = `https://graph.facebook.com/${API_VERSION}`;

const server = new Server({ name: "instagram-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

// Helper da Graph API
async function igApiCall(method: 'GET' | 'POST', endpoint: string, data: any = {}) {
    try {
        const url = `${META_API_BASE}${endpoint}`;
        const params = method === 'GET' ? { ...data, access_token: IG_ACCESS_TOKEN } : { access_token: IG_ACCESS_TOKEN };
        const body = method === 'POST' ? data : undefined;

        const response = await axios({ method, url, params, data: body });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`Instagram API Error: ${JSON.stringify(error.response.data.error, null, 2)}`);
        }
        throw new Error(`Request failed: ${error.message}`);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "publicar_midia",
                description: "Publica uma única foto, video(reels) ou story no Instagram Business.",
                inputSchema: {
                    type: "object",
                    properties: {
                        tipo_midia: { type: "string", enum: ["IMAGE", "REELS", "STORIES"], description: "Tipo de post" },
                        image_url: { type: "string", description: "URL pública obrigatória da mídia (JPG, MP4)" },
                        legenda: { type: "string", description: "Texto da legenda do post (ignorada no Stories)" },
                        compartilhar_feed: { type: "boolean", description: "Para REELS: True se deve ir para o feed geral tbm." }
                    },
                    required: ["tipo_midia", "image_url"]
                }
            },
            {
                name: "obter_insights_perfil",
                description: "Obtém métricas do Perfil nos últimos 28 dias ou período específico (Alcance, Visitas, Impressões, Seguidores).",
                inputSchema: {
                    type: "object",
                    properties: {
                        metricas: { type: "string", description: "Ex: impressions,reach,profile_views,follower_count" },
                        periodo: { type: "string", enum: ["day", "week", "month"], description: "Agrupamento temporal (padrão day)" }
                    },
                    required: ["metricas"]
                }
            },
            {
                name: "analisar_postagem",
                description: "Obtém dados completos de uma postagem específica (curtidas, comentários, salvamentos e alcance).",
                inputSchema: {
                    type: "object",
                    properties: {
                        media_id: { type: "string", description: "O ID único da publicação do Instagram a ser analisada" }
                    },
                    required: ["media_id"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};

    try {
        if (toolName === "publicar_midia") {
            const { tipo_midia, image_url, legenda, compartilhar_feed } = args as any;

            const containerPayload: any = {
                image_url: tipo_midia === "IMAGE" || tipo_midia === "STORIES" ? image_url : undefined,
                video_url: tipo_midia === "REELS" ? image_url : undefined,
                caption: legenda || "",
            };

            if (tipo_midia === "REELS") {
                containerPayload.media_type = "REELS";
                if (compartilhar_feed) containerPayload.share_to_feed = true;
            }
            if (tipo_midia === "STORIES") {
                containerPayload.media_type = "STORIES";
            }

            // 1. Cria o Container (Upload/Preparo)
            const containerData = await igApiCall("POST", `/${IG_USER_ID}/media`, containerPayload);
            const containerId = containerData.id;

            // 2. Espera a mídia processar se for Vídeo (Delay simplificado, ideal é webhook ou poll)
            if (tipo_midia === "REELS") {
                await new Promise(r => setTimeout(r, 6000)); // Aguarda processamento de vídeo
            }

            // 3. Publica de fato (Publish)
            const publishData = await igApiCall("POST", `/${IG_USER_ID}/media_publish`, {
                creation_id: containerId
            });

            return {
                content: [{ type: "text", text: `Publicado com Sucesso! Media ID: ${publishData.id}` }]
            };
        }

        if (toolName === "obter_insights_perfil") {
            const { metricas, periodo } = args as any;
            const data = await igApiCall("GET", `/${IG_USER_ID}/insights`, {
                metric: metricas,
                period: periodo || "day"
            });
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (toolName === "analisar_postagem") {
            const { media_id } = args as any;
            // Parte 1: Get Basic Info
            const mediaInfo = await igApiCall("GET", `/${media_id}`, {
                fields: "caption,media_type,media_url,permalink,timestamp,username,comments_count,like_count"
            });

            // Parte 2: Get Insights (Saves, Reach, etc) - falha silenciosa se for Reels as metricas mudam
            let insights = {};
            try {
                const metricList = mediaInfo.media_type === "VIDEO"
                    ? "plays,reach,saved,total_interactions"
                    : "impressions,reach,saved,engagement";

                insights = await igApiCall("GET", `/${media_id}/insights`, { metric: metricList });
            } catch (e: any) {
                insights = { _error: "Métricas de insight detalhadas não disponíveis ou não suportadas para este formato de mídia." };
            }

            // Parte 3: Get Ultimos Comentarios
            const comments = await igApiCall("GET", `/${media_id}/comments`, { fields: "text,username,timestamp" });

            const fullReport = {
                Informacoes_Basicas: mediaInfo,
                Desempenho_Insights: insights,
                Ultimos_Comentarios: comments.data || []
            };

            return { content: [{ type: "text", text: JSON.stringify(fullReport, null, 2) }] };
        }

        throw new Error(`Unknown tool: ${toolName}`);
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error on Instagram Tool ${toolName}:\n${error.message}` }],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Instagram MCP Server is running on stdio");
}

runServer().catch(console.error);
