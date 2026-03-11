import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function listModels() {
    try {
        console.log("Listing models...");
        const result = await genAI.models.list();
        let output = "";
        
        if (result.models) {
             result.models.forEach(m => {
                 output += `${m.name} | Methods: ${m.supportedMethods.join(', ')}\n`;
             });
        }
        
        fs.writeFileSync("models_list.txt", output);
        console.log("Results saved to models_list.txt");
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
