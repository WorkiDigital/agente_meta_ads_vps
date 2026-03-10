<template>
  <v-app-bar
    color="transparent"
    elevation="0"
    class="app-bar"
  >
    <v-container fluid class="d-flex align-center">
      <div class="d-flex align-center">
        <Logo />
        <span class="ml-2 text-h6 font-weight-bold gradient-text">
          Evolution Manager
        </span>
      </div>

      <v-spacer />

      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon
            v-bind="props"
            variant="text"
            class="mr-2"
          >
            <v-icon>mdi-translate</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="lang in languages"
            :key="lang.code"
            @click="changeLanguage(lang.code)"
          >
            <v-list-item-title>{{ lang.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        icon
        variant="text"
        @click="toggleTheme"
      >
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>
    </v-container>
  </v-app-bar>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import Logo from '@/components/global/Logo.vue'

const { locale } = useI18n()
const theme = useTheme()

const languages = ref([
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
])

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('language', lang)
}

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>

<style scoped>
.app-bar {
  background: rgba(15, 15, 26, 0.8) !important;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
