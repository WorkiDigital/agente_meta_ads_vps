/**
 * postar-carrosel-instagram.mjs
 * Faz upload das imagens para Supabase Storage e publica carrossel no Instagram.
 *
 * Uso:
 *   node --env-file=.env postar-carrosel-instagram.mjs \
 *     --pasta "../../Conteudos Herickson/carrosel/2026-03-09/ia-whatsapp" \
 *     --caption "Sua legenda aqui com #hashtags"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIGURAÇÕES ─────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://jgderqdwvyqfauxfwqsc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'instagram-media';

const META_TOKEN = process.env.META_ACCESS_TOKEN;
const IG_ID = '17841401666623403'; // @hericksonmaia
const IG_BASE = 'https://graph.facebook.com/v21.0';

// ── ARGS ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const pastaIdx = args.indexOf('--pasta');
const captionIdx = args.indexOf('--caption');

if (pastaIdx === -1) {
  console.error('❌ Informe a pasta com --pasta "caminho/relativo"');
  process.exit(1);
}

const pastaRel = args[pastaIdx + 1];
const pasta = path.resolve(__dirname, pastaRel);
const captionFileIdx = args.indexOf('--caption-file');

let caption = '';
if (captionFileIdx >= 0) {
  caption = fs.readFileSync(path.resolve(__dirname, args[captionFileIdx + 1]), 'utf8');
} else if (captionIdx >= 0) {
  caption = args.slice(captionIdx + 1).join(' ');
}

// ── FUNÇÕES ───────────────────────────────────────────────────────────────────

async function uploadSupabase(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `carrosel/${Date.now()}_${fileName}`;
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': mimeType,
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

async function criarContainerImagem(imageUrl) {
  const res = await fetch(`${IG_BASE}/${IG_ID}/media?access_token=${META_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, is_carousel_item: true }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Erro ao criar container: ${JSON.stringify(data)}`);
  return data.id;
}

async function criarContainerCarrosel(children, caption) {
  const res = await fetch(`${IG_BASE}/${IG_ID}/media?access_token=${META_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: children.join(','),
      caption,
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Erro ao criar carrossel: ${JSON.stringify(data)}`);
  return data.id;
}

async function publicarCarrosel(creationId) {
  const res = await fetch(`${IG_BASE}/${IG_ID}/media_publish?access_token=${META_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Erro ao publicar: ${JSON.stringify(data)}`);
  return data.id;
}

async function deletarSupabase(storagePaths) {
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: storagePaths }),
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_KEY) throw new Error('SUPABASE_SERVICE_KEY não definida no .env');
  if (!META_TOKEN) throw new Error('META_ACCESS_TOKEN não definida no .env');

  // 1. Lista imagens ordenadas
  const arquivos = fs.readdirSync(pasta)
    .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'))
    .sort()
    .map(f => path.join(pasta, f));

  if (arquivos.length < 2 || arquivos.length > 10) {
    throw new Error(`Instagram aceita entre 2 e 10 imagens no carrossel. Encontradas: ${arquivos.length}`);
  }

  console.log(`\n📂 Pasta: ${pasta}`);
  console.log(`🖼  ${arquivos.length} imagens encontradas\n`);

  const storagePaths = [];

  // 2. Upload para Supabase
  console.log('⬆️  Fazendo upload para Supabase Storage...');
  const urls = [];
  for (const filePath of arquivos) {
    const fileName = path.basename(filePath);
    process.stdout.write(`   ${fileName}... `);
    const { publicUrl, storagePath } = await uploadSupabase(filePath, fileName);
    urls.push(publicUrl);
    storagePaths.push(storagePath);
    console.log('✅');
  }

  // 3. Cria containers individuais no Instagram
  console.log('\n📦 Criando containers no Instagram...');
  const containerIds = [];
  for (let i = 0; i < urls.length; i++) {
    process.stdout.write(`   [${i + 1}/${urls.length}]... `);
    const id = await criarContainerImagem(urls[i]);
    containerIds.push(id);
    console.log(`✅ ${id}`);
    await sleep(1000);
  }

  // 4. Cria container do carrossel
  console.log('\n🗂  Criando container do carrossel...');
  const carrosselId = await criarContainerCarrosel(containerIds, caption);
  console.log(`✅ Carrossel ID: ${carrosselId}`);

  // 5. Aguarda processamento
  console.log('\n⏳ Aguardando processamento (15s)...');
  await sleep(15000);

  // 6. Publica
  console.log('🚀 Publicando no Instagram...');
  const postId = await publicarCarrosel(carrosselId);
  console.log(`\n✅ Carrossel publicado! Post ID: ${postId}`);
  console.log(`🔗 https://www.instagram.com/p/${postId}/\n`);

  // 7. Remove imagens do Supabase
  console.log('🧹 Removendo imagens temporárias do Supabase...');
  await deletarSupabase(storagePaths);
  console.log('✅ Limpeza concluída.\n');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
