import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = process.env.META_API_VERSION || "v19.0";

if (!META_ACCESS_TOKEN) {
    console.error("META_ACCESS_TOKEN is required in .env");
    process.exit(1);
}

const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

const server = new Server(
    {
        name: "facebook-ads-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Meta API Helper
async function metaApiCall(method: 'GET' | 'POST', endpoint: string, data: any = {}) {
    try {
        const url = `${META_API_BASE}${endpoint}`;
        const params = method === 'GET' ? { ...data, access_token: META_ACCESS_TOKEN } : { access_token: META_ACCESS_TOKEN };
        const body = method === 'POST' ? data : undefined;

        const response = await axios({
            method,
            url,
            params,
            data: body,
        });
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`Meta API Error: ${JSON.stringify(error.response.data.error, null, 2)}`);
        }
        throw new Error(`Request failed: ${error.message}`);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_ads_insights",
                description: "Retrieves essential metrics (reach, impressions, spend, cpc, cpm, ctr, actions) from a Meta ad account.",
                inputSchema: {
                    type: "object",
                    properties: {
                        ad_account_id: { type: "string", description: "The ad account ID (e.g., act_123456789)" },
                        date_preset: { type: "string", description: "E.g., today, last_30d, maximum, lifetime" },
                        level: { type: "string", enum: ["campaign", "adset", "ad", "account"], description: "Optional level of the insight (default: adset or campaign)" }
                    },
                    required: ["ad_account_id", "date_preset"]
                }
            },
            {
                name: "create_ad_campaign_flow",
                description: "Creates an entire Meta ad campaign flow sequentially (Campaign -> AdSet -> AdCreative -> Ad)",
                inputSchema: {
                    type: "object",
                    properties: {
                        ad_account_id: { type: "string", description: "The ad account ID (e.g., act_123456789)" },
                        campaign_objective: { type: "string", description: "e.g., OUTCOME_TRAFFIC, OUTCOME_LEADS, OUTCOME_SALES" },
                        budget_daily: { type: "number", description: "Daily budget in the account's currency minor units (e.g., cents. So $50.00 is 5000)" },
                        page_id: { type: "string", description: "Facebook Page ID for the Ad" },
                        image_hash: { type: "string", description: "Hash of an already uploaded image (provide this OR image_url)" },
                        image_url: { type: "string", description: "URL of the image to use for the Ad (provide this OR image_hash)" }
                    },
                    required: ["ad_account_id", "campaign_objective", "budget_daily", "page_id"]
                }
            },
            {
                name: "optimize_adset_budget",
                description: "Changes the daily budget or status (PAUSED/ACTIVE) of an existing Ad Set.",
                inputSchema: {
                    type: "object",
                    properties: {
                        adset_id: { type: "string", description: "The ID of the ad set to edit" },
                        new_daily_budget: { type: "number", description: "New daily budget in minor currency units (optional)" },
                        status: { type: "string", enum: ["PAUSED", "ACTIVE"], description: "New status for the ad set (optional)" }
                    },
                    required: ["adset_id"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};

    try {
        if (toolName === "get_ads_insights") {
            const { ad_account_id, date_preset, level } = args as any;

            const params: any = {
                fields: "reach,impressions,spend,cpc,cpm,ctr,actions",
                date_preset: date_preset,
            };
            if (level) {
                params.level = level;
            }

            const data = await metaApiCall("GET", `/${ad_account_id}/insights`, params);
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
        }

        if (toolName === "create_ad_campaign_flow") {
            const { ad_account_id, campaign_objective, budget_daily, page_id, image_hash, image_url } = args as any;

            if (!image_hash && !image_url) {
                throw new Error("Must provide either image_hash or image_url");
            }

            // 1. Create Campaign
            const campaignData = await metaApiCall("POST", `/${ad_account_id}/campaigns`, {
                name: `Automated Campaign - ${new Date().toISOString()}`,
                objective: campaign_objective,
                status: "PAUSED", // Always paused by default for safety
                special_ad_categories: ["NONE"]
            });
            const campaignId = campaignData.id;

            // 2. Create Ad Set
            const adSetData = await metaApiCall("POST", `/${ad_account_id}/adsets`, {
                name: `Automated AdSet - ${new Date().toISOString()}`,
                campaign_id: campaignId,
                daily_budget: budget_daily,
                billing_event: "IMPRESSIONS",
                optimization_goal: "REACH", // Padrão genérico, pode ser adaptado
                bid_amount: 100, // Bid genérico de $1.00 ou equivalente
                status: "PAUSED",
                promoted_object: { page_id: page_id },
                targeting: {
                    geo_locations: { countries: ["US", "BR"] } // Locations padrão
                }
            });
            const adSetId = adSetData.id;

            // 3. Create Ad Creative
            const creativePayload: any = {
                name: `Automated Creative - ${new Date().toISOString()}`,
                object_story_spec: {
                    page_id: page_id,
                    link_data: {
                        link: `https://facebook.com/${page_id}`, // Link fallback
                        message: "Automated Ad Created via MCP Agent",
                    }
                }
            };

            if (image_hash) {
                creativePayload.object_story_spec.link_data.image_hash = image_hash;
            } else if (image_url) {
                creativePayload.object_story_spec.link_data.picture = image_url;
            }

            const creativeData = await metaApiCall("POST", `/${ad_account_id}/adcreatives`, creativePayload);
            const creativeId = creativeData.id;

            // 4. Create Ad
            const adData = await metaApiCall("POST", `/${ad_account_id}/ads`, {
                name: `Automated Ad - ${new Date().toISOString()}`,
                adset_id: adSetId,
                creative: { creative_id: creativeId },
                status: "PAUSED"
            });
            const adId = adData.id;

            const result = {
                message: "Successfully created full Campaign flow.",
                campaign_id: campaignId,
                adset_id: adSetId,
                creative_id: creativeId,
                ad_id: adId
            };

            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
            };
        }

        if (toolName === "optimize_adset_budget") {
            const { adset_id, new_daily_budget, status } = args as any;

            const payload: any = {};
            if (new_daily_budget !== undefined) payload.daily_budget = new_daily_budget;
            if (status !== undefined) payload.status = status;

            if (Object.keys(payload).length === 0) {
                throw new Error("You must provide either new_daily_budget or status to update.");
            }

            const data = await metaApiCall("POST", `/${adset_id}`, payload);

            return {
                content: [{ type: "text", text: JSON.stringify({ success: true, response: data, updated_fields: payload }, null, 2) }]
            };
        }

        throw new Error(`Unknown tool: ${toolName}`);
    } catch (error: any) {
        // Retorna erro bem limpo como texto (capturando erros da Graph API)
        return {
            content: [{ type: "text", text: `Error executing tool ${toolName}:\n${error.message}` }],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Facebook Ads MCP Server is fully operational and running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
