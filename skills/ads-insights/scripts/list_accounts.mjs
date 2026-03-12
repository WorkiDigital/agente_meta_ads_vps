import "dotenv/config";
import axios from 'axios';

const token = process.env.META_ACCESS_TOKEN;

async function listAdAccounts() {
    if (!token) {
        console.error('❌ Erro: META_ACCESS_TOKEN não definido.');
        process.exit(1);
    }
    
    try {
        console.log("🔍 Buscando Contas de Anúncios...");
        const r = await axios.get(`https://graph.facebook.com/v19.0/me/adaccounts`, {
            params: {
                access_token: token,
                fields: 'id,name,account_id,account_status,currency'
            }
        });

        const accounts = r.data.data || [];
        
        if (accounts.length === 0) {
            console.log("ℹ️ Nenhuma conta de anúncios encontrada para este token.");
            return;
        }

        let report = `*LISTA DE CONTAS DE ANÚNCIOS*\n\n`;
        accounts.forEach((acc, i) => {
            const status = acc.account_status === 1 ? "✅ Ativa" : "⚠️ Inativa/Erro";
            report += `${i+1}. *${acc.name}*\n`;
            report += `🆔 ID: ${acc.id}\n`;
            report += `💰 Moeda: ${acc.currency}\n`;
            report += `📊 Status: ${status}\n\n`;
        });

        console.log(report);
    } catch (e) {
        console.error(e.response ? JSON.stringify(e.response.data, null, 2) : e.message);
        process.exit(1);
    }
}

listAdAccounts();
