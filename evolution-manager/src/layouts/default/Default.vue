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
import AppBar from './AppBar.vue'
import Drawer from './Drawer.vue'
import ConnectionSetup from '@/components/global/ConnectionSetup.vue'
</script>
