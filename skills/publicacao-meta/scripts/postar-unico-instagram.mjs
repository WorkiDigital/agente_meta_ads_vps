import "dotenv/config";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../../');

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = 'https://jgderqdwvyqfauxfwqsc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'instagram-media';

const META_TOKEN = process.env.META_ACCESS_TOKEN;
const IG_ID = '17841401666623403'; // @hericksonmaia
const IG_BASE = 'https://graph.facebook.com/v21.0';

// --- ARGS ---
const args = process.argv.slice(2);
const pastaIdx = args.indexOf('--pasta');
const captionIdx = args.indexOf('--caption');

if (pastaIdx === -1) {
  console.error('❌ Informe a pasta com --pasta "caminho/relativo"');
  process.exit(1);
}

const pastaRel = args[pastaIdx + 1];
const pasta = path.resolve(projectRoot, pastaRel);
const captionFileIdx = args.indexOf('--caption-file');

let caption = '';
if (captionFileIdx >= 0) {
  caption = fs.readFileSync(path.resolve(projectRoot, args[captionFileIdx + 1]), 'utf8');
} else if (captionIdx >= 0) {
  caption = args.slice(captionIdx + 1).join(' ');
}

// --- FUNÇÕES ---

async function uploadSupabase(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `posts_temporarios/${Date.now()}_${fileName}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload falhou (${res.status}): ${err}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  return { publicUrl, storagePath };
}

async function criarContainerUnico(imageUrl, caption) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  
  try {
    const res = await fetch(`${IG_BASE}/${IG_ID}/media?access_token=${META_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Graph API Error (${res.status}): ${errorText}`);
    }
    
    const data = await res.json();
    if (!data.id) throw new Error(`Erro desconhecido ao criar container: ${JSON.stringify(data)}`);
    return data.id;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout de 20s atingido na API do Instagram.');
    }
    throw error;
  }
}

async function deletarSupabase(storagePaths) {
  console.log(`🧹 Removendo imagens temporárias do Supabase...`);
  for(const spath of storagePaths) {
     await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${spath}`, {
         method: 'DELETE',
         headers: {
           'Authorization': `Bearer ${SUPABASE_KEY}`,
           'apikey': SUPABASE_KEY
         }
     });
  }
}

async function publicarPost(creationId) {
  const res = await fetch(`${IG_BASE}/${IG_ID}/media_publish?access_token=${META_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Erro ao publicar: ${JSON.stringify(data)}`);
  return data.id;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- MAIN ---
async function main() {
  console.log('🚀 Iniciando script de postagem...');
  
  if (!SUPABASE_KEY || !META_TOKEN) {
    console.log('⚠️ Erro: Variáveis de ambiente não carregadas corretamente.');
    console.log('SUPABASE_KEY:', SUPABASE_KEY ? 'Presente' : 'Ausente');
    console.log('META_TOKEN:', META_TOKEN ? 'Presente' : 'Ausente');
    throw new Error('Variáveis de ambiente ausentes. Verifique o arquivo .env na raiz.');
  }

  if (!fs.existsSync(pasta)) {
    throw new Error(`Pasta não encontrada: ${pasta}`);
  }

  const arquivos = fs.readdirSync(pasta)
    .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'))
    .sort()
    .map(f => path.join(pasta, f));

  if (arquivos.length === 0) {
    throw new Error(`Nenhuma imagem encontrada na pasta: ${pasta}`);
  }

  console.log(`📂 Pasta: ${pasta}`);
  console.log(`🖼️  ${arquivos.length} imagens encontradas\n`);

  const storagePaths = [];
  const urls = [];
  
  console.log('⬆️  Fazendo upload para Supabase Storage...');
  for (const filePath of arquivos) {
    const fileName = path.basename(filePath);
    process.stdout.write(`   ${fileName}... `);
    const { publicUrl, storagePath } = await uploadSupabase(filePath, fileName);
    urls.push(publicUrl);
    storagePaths.push(storagePath);
    console.log('✅');
  }

  if (arquivos.length === 1) {
    console.log('\n📦 Criando container único no Instagram...');
    const containerId = await criarContainerUnico(urls[0], caption);
    console.log(`✅ Container ID: ${containerId}`);

    console.log('\n⏳ Aguardando processamento (10s)...');
    await sleep(10000);

    console.log('🚀 Publicando no Instagram...');
    const postId = await publicarPost(containerId);
    console.log(`\n✅ Post único publicado! Post ID: ${postId}`);
    console.log(`🔗 https://www.instagram.com/p/${postId}/\n`);
  } else {
    throw new Error('Este script é para imagem única. Use postar-carrosel-instagram.mjs para carrosséis.');
  }

  await deletarSupabase(storagePaths);
  console.log('✅ Limpeza concluída.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
