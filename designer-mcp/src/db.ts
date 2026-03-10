import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Profile {
  handle: string;
  name: string;
  profession: string;
  bio: string;
  tone_of_voice: string;
  colors: string[];
  fonts: string[];
  branding_rules: string[];
}

export interface ModelPost {
  id: string;
  content: string;
  description: string;
  addedAt: string;
}

export interface PhotoReference {
  id: string;
  filename: string;
  description: string;
  addedAt: string;
}

export interface DatabaseSchema {
  profile: Profile;
  model_posts: ModelPost[];
  photos: PhotoReference[];
}

const dbPath = path.join(__dirname, '..', 'data.json');

const defaultDb: DatabaseSchema = {
  profile: {
    handle: "@eriksonmaia",
    name: "Herickson Maia",
    profession: "Estrategista de Tráfego Pago",
    bio: "Especialista em automação e escala de vendas através de tráfego pago.",
    tone_of_voice: "Profissional, direto, estratégico, com termos de marketing/digital.",
    colors: ["#000000", "#FFFFFF", "#1E40AF"],
    fonts: ["Arial Black", "Arial", "Georgia"],
    branding_rules: [
      "Sempre usar o handle @eriksonmaia ✓ no rodapé das imagens.",
      "Usar fundo escuro com overlay de 58% de opacidade.",
      "A barra de assinatura deve estar no rodapé da imagem.",
      "A foto de perfil deve ser circular no canto inferior esquerdo da barra.",
      "Títulos em Arial Black, Negrito, tamanho ~44px.",
      "Subtítulos em Arial, tamanho ~26px, cor branca ou cinza claro.",
      "Imagens de fundo devem ser minimalistas ou conceituais, geradas pela IA."
    ]
  },
  model_posts: [],
  photos: []
};

// Initialize DB if it doesn't exist
function initDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
  }
}

export function readDb(): DatabaseSchema {
  initDb();
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

export function writeDb(data: DatabaseSchema) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function updateProfile(profileContent: Partial<Profile>) {
  const db = readDb();
  db.profile = { ...db.profile, ...profileContent };
  writeDb(db);
  return db.profile;
}

export function addModelPost(content: string, description: string) {
  const db = readDb();
  const newPost: ModelPost = {
    id: Date.now().toString(),
    content,
    description,
    addedAt: new Date().toISOString()
  };
  db.model_posts.push(newPost);
  writeDb(db);
  return newPost;
}

export function addPhotoReference(filename: string, description: string) {
  const db = readDb();
  const newPhoto: PhotoReference = {
    id: Date.now().toString(),
    filename,
    description,
    addedAt: new Date().toISOString()
  };
  db.photos.push(newPhoto);
  writeDb(db);
  return newPhoto;
}
