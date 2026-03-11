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
        console.log("Type of result:", typeof result);
        console.log("Result:", JSON.stringify(result, null, 2));

        if (Array.isArray(result)) {
            result.forEach(m => console.log(`- ${m.name}`));
        } else if (result.models) {
             result.models.forEach(m => console.log(`- ${m.name}`));
        } else {
             console.log("No models found in result");
        }
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
