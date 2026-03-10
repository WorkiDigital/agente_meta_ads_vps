import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath } from 'node:url'
import { URL as NodeURL } from 'node:url'
import ViteFonts from 'unplugin-fonts/vite'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
    ViteFonts({
      google: {
        families: ['Roboto:wght@100;300;400;500;700;900'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new NodeURL('./src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 3000,
  },
})
