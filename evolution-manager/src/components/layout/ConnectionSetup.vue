<template>
  <v-dialog v-model="show" persistent max-width="500">
    <v-card class="glass-card pa-4">
      <v-card-title class="text-center">
        <v-icon size="64" color="success" class="pulse-glow mb-4">mdi-whatsapp</v-icon>
        <div class="text-h5">Conectar à Evolution API</div>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>

        <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">
          {{ successMessage }}
        </v-alert>

        <v-form v-model="valid">
          <v-text-field
            v-model="formData.url"
            label="URL da API"
            variant="outlined"
            prepend-inner-icon="mdi-web"
            :rules="[v => !!v || 'Campo obrigatório']"
            :disabled="appStore.isConnected"
            class="mb-2"
            placeholder="https://api.evolution.com"
          />

          <v-text-field
            v-model="formData.apikey"
            label="API Key"
            variant="outlined"
            prepend-inner-icon="mdi-key"
            type="password"
            :rules="[v => !!v || 'Campo obrigatório']"
            :disabled="appStore.isConnected"
            placeholder="sua-api-key-aqui"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="appStore.isConnected"
          variant="text"
          @click="disconnect"
          :disabled="appStore.loading"
        >
          Desconectar
        </v-btn>
        <v-btn
          v-if="appStore.isConnected"
          color="primary"
          @click="show = false"
        >
          Fechar
        </v-btn>
        <v-btn
          v-else
          color="primary"
          :disabled="!valid"
          :loading="appStore.loading"
          @click="connect"
          block
        >
          Conectar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/store'

const appStore = useAppStore()

const show = ref(false)
const valid = ref(false)
const error = ref(null)
const successMessage = ref(null)
const formData = ref({
  url: appStore.connection.url,
  apikey: appStore.connection.apikey,
})

// Show when not connected
watch(() => appStore.isConnected, (connected) => {
  if (!connected) {
    show.value = true
    error.value = null
    successMessage.value = null
  }
}, { immediate: true })

// Watch for store errors
watch(() => appStore.error, (err) => {
  if (err) {
    error.value = err
    successMessage.value = null
  }
})

const connect = async () => {
  error.value = null
  successMessage.value = null
  
  appStore.connection.url = formData.value.url
  appStore.connection.apikey = formData.value.apikey
  
  const result = await appStore.connect()
  
  if (result.success) {
    successMessage.value = 'Conectado com sucesso!'
    setTimeout(() => {
      show.value = false
    }, 1500)
  } else {
    error.value = result.error || 'Erro ao conectar'
  }
}

const disconnect = () => {
  appStore.disconnect()
  error.value = null
  successMessage.value = null
  show.value = true
}
</script>
