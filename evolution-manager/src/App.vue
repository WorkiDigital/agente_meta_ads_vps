<template>
  <v-app>
    <AppBar />
    <Drawer />
    
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>

    <ConnectionSetup />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore, useCrmStore } from './store'
import AppBar from './components/layout/AppBar.vue'
import Drawer from './components/layout/Drawer.vue'
import ConnectionSetup from './components/layout/ConnectionSetup.vue'

const appStore = useAppStore()
const crmStore = useCrmStore()

onMounted(() => {
  appStore.loadInstances()
  crmStore.loadLeads()
})
</script>
