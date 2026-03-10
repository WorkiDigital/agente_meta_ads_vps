<template>
  <v-dialog
    v-model="showDialog"
    :persistent="!isConnected"
    max-width="500"
  >
    <v-card class="glass-card">
      <v-card-title class="text-h5 text-center pa-6">
        <v-icon size="64" color="success" class="mb-4">mdi-whatsapp</v-icon>
        <div>Conectar à Evolution API</div>
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Success Message -->
        <v-alert
          v-if="isConnected"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          Conectado com sucesso!
        </v-alert>

        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="formData.url"
            label="URL da API *"
            prepend-inner-icon="mdi-web"
            variant="outlined"
            :rules="[rules.required]"
            placeholder="https://api.example.com"
            class="mb-4"
            :disabled="isConnected"
          />

          <v-text-field
            v-model="formData.apikey"
            label="API Key *"
            prepend-inner-icon="mdi-key"
            variant="outlined"
            :rules="[rules.required]"
            type="password"
            placeholder="Sua API Key"
            :disabled="isConnected"
          />
        </v-form>

        <!-- Error Message -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-btn
          v-if="isConnected"
          variant="text"
          @click="disconnect"
        >
          Desconectar
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="isConnected"
          color="primary"
          variant="flat"
          @click="closeDialog"
        >
          Fechar
        </v-btn>
        <v-btn
          v-else
          color="primary"
          size="large"
          variant="flat"
          :loading="loading"
          :disabled="!valid"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/store'

const appStore = useAppStore()

const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const showDialog = ref(false)
const errorMessage = ref('')

const formData = ref({
  url: '',
  apikey: '',
})

const isConnected = computed(() => appStore.isConnected)

// Show dialog when not connected
watch(isConnected, (newValue) => {
  if (!newValue) {
    showDialog.value = true
  }
}, { immediate: true })

const rules = {
  required: value => !!value || 'Campo obrigatório',
}

const connect = async () => {
  if (!valid.value) return

  loading.value = true
  errorMessage.value = ''
  
  appStore.connection.url = formData.value.url
  appStore.connection.apikey = formData.value.apikey

  const success = await appStore.connect()
  loading.value = false

  if (!success) {
    errorMessage.value = 'Erro ao conectar. Verifique a URL e API Key.'
  }
}

const disconnect = () => {
  appStore.disconnect()
  errorMessage.value = ''
}

const closeDialog = () => {
  showDialog.value = false
}

onMounted(async () => {
  // Try to reconnect if credentials exist
  if (appStore.connection.url && appStore.connection.apikey) {
    formData.value.url = appStore.connection.url
    formData.value.apikey = appStore.connection.apikey
    await appStore.reconnect()
  } else {
    showDialog.value = true
  }
})
</script>
