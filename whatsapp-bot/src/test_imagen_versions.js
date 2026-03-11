import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Teste 1: SEM apiVersion (default do SDK)
async function testDefault() {
    console.log("\n=== TESTE 1: Sem apiVersion (padrão do SDK) ===");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const result = await ai.models.generateImages({
            model: "imagen-4.0-fast-generate-001",
            prompt: "a beautiful sunset over the ocean, professional photo, 8k",
            config: { numberOfImages: 1 }
        });
        const imgs = result.generatedImages || [];
        if (imgs.length > 0 && imgs[0].image?.imageBytes) {
            fs.writeFileSync("test_default.jpg", Buffer.from(imgs[0].image.imageBytes, "base64"));
            console.log("✅ SUCESSO! Imagem salva em test_default.jpg");
        } else {
            console.log("⚠️ Sem imagens retornadas");
        }
    } catch (e) {
        console.error("❌ FALHOU:", e.message.substring(0, 200));
    }
}

// Teste 2: Com apiVersion v1beta
async function testV1Beta() {
    console.log("\n=== TESTE 2: apiVersion v1beta ===");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: "v1beta" });
    try {
        const result = await ai.models.generateImages({
            model: "imagen-4.0-fast-generate-001",
            prompt: "a beautiful sunset over the ocean, professional photo, 8k",
            config: { numberOfImages: 1 }
        });
        const imgs = result.generatedImages || [];
        if (imgs.length > 0 && imgs[0].image?.imageBytes) {
            fs.writeFileSync("test_v1beta.jpg", Buffer.from(imgs[0].image.imageBytes, "base64"));
            console.log("✅ SUCESSO! Imagem salva em test_v1beta.jpg");
        } else {
            console.log("⚠️ Sem imagens retornadas");
        }
    } catch (e) {
        console.error("❌ FALHOU:", e.message.substring(0, 200));
    }
}

// Teste 3: Com apiVersion v1
async function testV1() {
    console.log("\n=== TESTE 3: apiVersion v1 ===");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: "v1" });
    try {
        const result = await ai.models.generateImages({
            model: "imagen-4.0-fast-generate-001",
            prompt: "a beautiful sunset over the ocean, professional photo, 8k",
            config: { numberOfImages: 1 }
        });
        const imgs = result.generatedImages || [];
        if (imgs.length > 0 && imgs[0].image?.imageBytes) {
            fs.writeFileSync("test_v1.jpg", Buffer.from(imgs[0].image.imageBytes, "base64"));
            console.log("✅ SUCESSO! Imagem salva em test_v1.jpg");
        } else {
            console.log("⚠️ Sem imagens retornadas");
        }
    } catch (e) {
        console.error("❌ FALHOU:", e.message.substring(0, 200));
    }
}

await testDefault();
await testV1Beta();
await testV1();

console.log("\n🏁 Testes finalizados.");
