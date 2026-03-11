import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readDb, updateProfile, addModelPost, addPhotoReference } from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Create server instance
const server = new McpServer({
    name: "designer-brand-mcp",
    version: "1.0.0",
});

// Resources implementation
server.resource(
    "profile",
    "designer://profile",
    async (uri) => {
        const db = readDb();
        return {
            contents: [{
                uri: uri.href,
                text: JSON.stringify(db.profile, null, 2),
                mimeType: "application/json"
            }]
        };
    }
);

server.resource(
    "models",
    "designer://models",
    async (uri) => {
        const db = readDb();
        return {
            contents: [{
                uri: uri.href,
                text: JSON.stringify(db.model_posts, null, 2),
                mimeType: "application/json"
            }]
        };
    }
);

server.resource(
    "photos",
    "designer://photos",
    async (uri) => {
        const db = readDb();
        return {
            contents: [{
                uri: uri.href,
                text: JSON.stringify(db.photos, null, 2),
                mimeType: "application/json"
            }]
        };
    }
);

// Tools implementation
server.tool(
    "set_profile",
    "Set or update your brand profile (tone of voice, niche, etc.)",
    {
        name: z.string().optional().describe("Your brand or persona name"),
        niche: z.string().optional().describe("The niche or market you operate in"),
        toneOfVoice: z.string().optional().describe("The tone you use (e.g. professional, funny, authoritative)"),
        brandIdentity: z.string().optional().describe("Core values or visual identity guidelines"),
        otherDetails: z.string().optional().describe("Any other relevant instructions")
    },
    async (args) => {
        const updated = updateProfile(args);
        return {
            content: [{ type: "text", text: `Profile updated successfully:\n${JSON.stringify(updated, null, 2)}` }]
        };
    }
);

server.tool(
    "add_model_post",
    "Save a reference text or post that perfectly represents your style",
    {
        content: z.string().describe("The exact text of the post"),
        description: z.string().describe("What this post is about / why it's a good model")
    },
    async ({ content, description }) => {
        const added = addModelPost(content, description);
        return {
            content: [{ type: "text", text: `Model post added successfully. ID: ${added.id}` }]
        };
    }
);

server.tool(
    "add_photo",
    "Register a photo reference to your designer database",
    {
        filename: z.string().describe("The filename of the image in the current directory"),
        description: z.string().describe("A visual description of the photo")
    },
    async ({ filename, description }) => {
        const added = addPhotoReference(filename, description);
        return {
            content: [{ type: "text", text: `Photo reference added successfully. ID: ${added.id}` }]
        };
    }
);

server.tool(
    "list_organized_content",
    "Lista as categorias de posts estruturadas (Carrossel, Post Estático) e seus conteúdos.",
    {},
    async () => {
        const postsPath = path.join(__dirname, '..', 'posts');
        if (!fs.existsSync(postsPath)) {
            return { content: [{ type: "text", text: "Pasta de posts não encontrada." }] };
        }

        const categories = fs.readdirSync(postsPath);
        let output = "Estrutura do Catálogo de Posts:\n";

        for (const cat of categories) {
            const catPath = path.join(postsPath, cat);
            if (fs.statSync(catPath).isDirectory()) {
                output += `\n- ${cat.toUpperCase()}:\n`;
                const dateFolders = fs.readdirSync(catPath);
                for (const date of dateFolders) {
                    output += `  - [${date}]\n`;
                    const datePath = path.join(catPath, date);
                    if (fs.statSync(datePath).isDirectory()) {
                        const files = fs.readdirSync(datePath);
                        files.forEach(f => output += `    - ${f}\n`);
                    }
                }
            }
        }
        return {
            content: [{ type: "text", text: output }]
        };
    }
);

server.tool(
    "gerar_slide_premium",
    "Gera um slide de alta qualidade seguindo a identidade visual premium (fundo IA, overlay, handle e profissão).",
    {
        texto: z.string().describe("O texto principal do slide (pode ter \n para quebras)"),
        promptImagem: z.string().describe("Prompt para o Gemini gerar a imagem de fundo (ex: 'cinematic tech photo...')"),
        pasta_destino: z.string().describe("Subpasta dentro de 'posts' (ex: 'post estático/2026-03-09')"),
        nome_arquivo: z.string().describe("Nome do arquivo (ex: 'slide-1.jpg')")
    },
    async ({ texto, promptImagem, pasta_destino, nome_arquivo }) => {
        const db = readDb();
        const profile = db.profile;
        //@ts-ignore
        const model = genAI.getGenerativeModel({ model: "imagen-4.0-fast-generate-001" });

        // 1. Gerar imagem de fundo
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: promptImagem }] }],
            //@ts-ignore
            config: { responseModalities: ["TEXT", "IMAGE"] }
        });

        const part = result.response.candidates?.[0]?.content?.parts?.[0];
        let bgBuffer: Buffer | null = null;

        //@ts-ignore
        if (part?.inlineData) {
            //@ts-ignore
            bgBuffer = Buffer.from(part.inlineData.data, "base64");
        }

        if (!bgBuffer) {
            return { content: [{ type: "text", text: "Erro: O Gemini não retornou uma imagem." }] };
        }

        // 2. Processar com Sharp
        const SLIDE_W = 1080;
        const SLIDE_H = 1080;

        const overlay = Buffer.from(
            `<svg width="${SLIDE_W}" height="${SLIDE_H}">
                <rect width="${SLIDE_W}" height="${SLIDE_H}" fill="rgba(0,0,0,0.58)"/>
            </svg>`
        );

        // Quebra de texto simples
        const paragrafos = texto.split("\n\n");
        let linhasSvg = "";
        let y = 300;
        const FONT_SIZE = 48;
        const LINE_HEIGHT = 64;

        for (const paragrafo of paragrafos) {
            const palavras = paragrafo.split(" ");
            let atual = "";
            for (const p of palavras) {
                if ((atual + " " + p).trim().length <= 25) {
                    atual = (atual + " " + p).trim();
                } else {
                    const escaped = atual.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    linhasSvg += `<text x="540" y="${y}" font-family="Arial Black, Arial" font-size="${FONT_SIZE}" fill="white" text-anchor="middle" font-weight="900">${escaped}</text>`;
                    y += LINE_HEIGHT;
                    atual = p;
                }
            }
            if (atual) {
                const escaped = atual.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                linhasSvg += `<text x="540" y="${y}" font-family="Arial Black, Arial" font-size="${FONT_SIZE}" fill="white" text-anchor="middle" font-weight="900">${escaped}</text>`;
                y += LINE_HEIGHT;
            }
            y += 20;
        }

        const BAR_Y = 920;
        const textSvg = Buffer.from(
            `<svg width="${SLIDE_W}" height="${SLIDE_H}" xmlns="http://www.w3.org/2000/svg">
                ${linhasSvg}
                <!-- Barra de assinatura -->
                <rect x="0" y="${BAR_Y}" width="${SLIDE_W}" height="160" fill="rgba(0,0,0,0.7)"/>
                <text x="540" y="${BAR_Y + 60}" font-family="Arial Black, Arial" font-size="34" fill="white" font-weight="900" text-anchor="middle">${profile.handle}</text>
                <text x="540" y="${BAR_Y + 105}" font-family="Arial" font-size="26" fill="#cccccc" text-anchor="middle">${profile.profession}</text>
            </svg>`
        );

        const outPath = path.join(__dirname, '..', 'posts', pasta_destino);
        if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });
        const finalPath = path.join(outPath, nome_arquivo);

        await sharp(bgBuffer)
            .resize(SLIDE_W, SLIDE_H, { fit: "cover" })
            .composite([
                { input: overlay },
                { input: textSvg }
            ])
            .jpeg({ quality: 95 })
            .toFile(finalPath);

        return {
            content: [{ type: "text", text: `Slide premium gerado com sucesso em: ${finalPath}` }]
        };
    }
);

// Prompts implementation
server.prompt(
    "design_post",
    "Projeta um post estático ou carrossel seguindo as regras de branding premium.",
    {
        topic: z.string().describe("Tópico do novo post"),
        type: z.enum(["estatico", "carrosel"]).default("estatico").describe("Tipo de post")
    },
    ({ topic, type }) => {
        const db = readDb();
        const profile = db.profile;

        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Projete um post do tipo ${type} sobre o tópico: "${topic}"\n\n` +
                            `### PERFIL DA MARCA\n${JSON.stringify(profile, null, 2)}\n\n` +
                            `Regras:\n` +
                            `- Formato: JSON (pode ser usado diretamente na ferramenta gerar_slide_premium)\n` +
                            `- Slides: Lista de objetos com { texto, promptImagem, nome_arquivo }\n` +
                            `- Idioma: Português (PT-BR)\n` +
                            `- Temática: Marketing estratégico, impacto premium.\n\n` +
                            `Se for carrossel, crie 8 slides seguindo o padrão Herickson: Capa Impactante, O que está acontecendo, O problema, O que a IA/Solução faz, Exemplos práticos, Maior benefício (Escala), Erro comum, CTA com reserva de post.`
                    }
                }
            ]
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Designer Brand MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
