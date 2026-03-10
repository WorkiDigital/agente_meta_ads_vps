import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPABASE_URL = 'https://jgderqdwvyqfauxfwqsc.supabase.co';
const BUCKET = 'instagram-media';
const MEMORY_FOLDER = 'agent_memory';
const MAX_HISTORY = 30;

export class MemoryService {
    constructor(geminiApiKey, supabaseKey) {
        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        this.supabaseKey = supabaseKey;
        this.cache = {};
        this.headers = {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        };
    }

    _storagePath(sessionId) {
        // Sanitiza o session ID para usar como nome de arquivo
        const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${MEMORY_FOLDER}/${safe}.json`;
    }

    /**
     * Carrega memória do Supabase Storage
     */
    async load(sessionId) {
        if (this.cache[sessionId]) return this.cache[sessionId];

        try {
            const path = this._storagePath(sessionId);
            const url = `${SUPABASE_URL}/storage/v1/object/authenticated/${BUCKET}/${path}`;
            const { data } = await axios.get(url, { headers: this.headers });
            
            if (data && data.history) {
                this.cache[sessionId] = data;
                console.log(`🧠 Memória carregada: ${data.history.length} msgs + resumo`);
                return data;
            }
        } catch (e) {
            // 404 = arquivo não existe (sessão nova) — silencioso
            if (e.response?.status !== 404 && e.response?.status !== 400) {
                console.error('MemoryService.load erro:', e.message);
            }
        }

        const newMemory = { summary: '', history: [], message_count: 0 };
        this.cache[sessionId] = newMemory;
        return newMemory;
    }

    /**
     * Salva memória no Supabase Storage como JSON
     */
    async save(sessionId, memory) {
        this.cache[sessionId] = memory;

        try {
            const path = this._storagePath(sessionId);
            const content = JSON.stringify(memory);
            const blob = Buffer.from(content, 'utf-8');

            // Tenta upsert (update or insert) via PUT
            await axios.put(
                `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
                blob,
                {
                    headers: {
                        ...this.headers,
                        'Content-Type': 'application/json',
                        'x-upsert': 'true'
                    }
                }
            );
            console.log(`💾 Memória salva no Supabase: ${path}`);
        } catch (e) {
            console.error('❌ MemoryService.save erro:', e.response?.data || e.message);
        }
    }

    /**
     * Registra uma mensagem e gerencia a janela deslizante
     */
    async addMessages(sessionId, messages) {
        const memory = await this.load(sessionId);
        
        for (const msg of messages) {
            memory.history.push(msg);
        }
        memory.message_count += messages.length;

        // Trim se passou do limite
        if (memory.history.length > MAX_HISTORY) {
            await this.trimAndSummarize(sessionId, memory);
        }

        // Salva assincronamente (não bloqueia a resposta)
        this.save(sessionId, memory).catch(() => {});
        return memory;
    }

    /**
     * Compacta mensagens antigas em resumo via Gemini
     */
    async trimAndSummarize(sessionId, memory) {
        const excess = memory.history.length - MAX_HISTORY + 5;
        if (excess <= 0) return;

        const msgsToSummarize = memory.history.slice(0, excess);
        const msgsToKeep = memory.history.slice(excess);

        // Extrai textos para resumir
        const textos = msgsToSummarize
            .filter(m => m.parts?.some(p => p.text))
            .map(m => {
                const txt = m.parts.find(p => p.text)?.text || '';
                return `[${m.role}]: ${txt.substring(0, 150)}`;
            })
            .join('\n');

        if (textos.length > 50) {
            try {
                const summarizer = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await summarizer.generateContent(
                    `Resuma esta conversa em no máximo 3 frases CURTAS e objetivas em português. ` +
                    `Mantenha: nomes de pessoas, IDs de conta, ferramentas usadas e decisões tomadas. ` +
                    `NÃO inclua saudações, emojis ou formatação.\n\n` +
                    `Resumo anterior: ${memory.summary || '(primeira vez)'}\n\n` +
                    `Mensagens a resumir:\n${textos}`
                );
                memory.summary = result.response.text();
            } catch (e) {
                console.error('MemoryService.summarize erro:', e.message);
                memory.summary += ` | ${new Date().toLocaleDateString('pt-BR')}: +${msgsToSummarize.length} msgs.`;
            }
        }

        memory.history = msgsToKeep;
        console.log(`🧠 Memória compactada: ${msgsToSummarize.length} msgs removidas → resumo. ${msgsToKeep.length} mantidas.`);
    }

    /**
     * Retorna histórico completo para iniciar o chat do Gemini
     */
    async getHistory(sessionId) {
        const memory = await this.load(sessionId);
        const history = [];

        // Injeta resumo como contexto
        if (memory.summary && memory.summary.length > 10) {
            history.push({
                role: 'user',
                parts: [{ text: `[CONTEXTO DE CONVERSAS ANTERIORES]: ${memory.summary}` }]
            });
            history.push({
                role: 'model',
                parts: [{ text: 'Entendido, contexto carregado.' }]
            });
        }

        // Adiciona histórico ativo
        if (memory.history.length > 0) {
            history.push(...memory.history);
        }

        return history;
    }
}
