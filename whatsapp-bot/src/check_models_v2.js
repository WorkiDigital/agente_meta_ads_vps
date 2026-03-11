import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function listModels() {
    try {
        console.log("Listing models...");
        const result = await genAI.models.list();
        
        // Let's inspect the names directly
        const models = result.pageInternal || [];
        models.forEach(m => {
            if (m.name.includes("imagen") || m.name.includes("veo")) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
