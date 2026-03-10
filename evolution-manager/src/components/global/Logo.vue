<template>
  <div class="logo-container">
    <v-icon 
      size="32" 
      color="success"
      class="logo-icon"
    >
      mdi-whatsapp
    </v-icon>
  </div>
</template>

<script setup>
</script>

<style scoped>
.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  animation: pulse-glow 3s ease-in-out infinite;
}
</style>
