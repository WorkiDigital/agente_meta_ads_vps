<template>
  <v-app-bar color="rgba(15, 15, 26, 0.8)" elevation="0" class="app-bar">
    <v-container fluid class="d-flex align-center">
      <div class="d-flex align-center">
        <v-icon color="success" size="32" class="pulse-glow">mdi-whatsapp</v-icon>
        <span class="ml-3 text-h6 font-weight-bold gradient-text">
          Evolution Manager
        </span>
      </div>
      <v-spacer />
    </v-container>
  </v-app-bar>
</template>

<style scoped>
.app-bar {
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
