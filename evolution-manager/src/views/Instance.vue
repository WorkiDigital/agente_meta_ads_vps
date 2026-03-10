<template>
  <div>
    <v-breadcrumbs
      :items="breadcrumbs"
      class="pa-0 mb-4"
    >
      <template v-slot:divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>

    <div class="glass-card pa-6 mb-4">
      <h2 class="text-h4 mb-4">{{ instanceName }}</h2>
      
      <v-tabs v-model="tab" color="primary">
        <v-tab value="connection">Conexão</v-tab>
        <v-tab value="settings">Configurações</v-tab>
        <v-tab value="webhook">Webhook</v-tab>
        <v-tab value="messages">Mensagens</v-tab>
      </v-tabs>

      <v-tabs-window v-model="tab" class="mt-6">
        <!-- Connection Tab -->
        <v-tabs-window-item value="connection">
          <div class="text-center pa-8">
            <v-icon size="120" color="success">mdi-qrcode</v-icon>
            <h3 class="mt-4">Scan QR Code</h3>
            <p class="text-grey mt-2">Use seu WhatsApp para escanear o código QR</p>
            <v-btn
              class="mt-4"
              color="primary"
              prepend-icon="mdi-refresh"
            >
              Gerar Novo QR Code
            </v-btn>
          </div>
        </v-tabs-window-item>

        <!-- Settings Tab -->
        <v-tabs-window-item value="settings">
          <v-form>
            <v-switch
              label="Rejeitar Chamadas Automaticamente"
              color="primary"
              hide-details
              class="mb-4"
            />
            <v-switch
              label="Sempre Online"
              color="primary"
              hide-details
              class="mb-4"
            />
            <v-switch
              label="Ler Mensagens Automaticamente"
              color="primary"
              hide-details
              class="mb-4"
            />
            <v-btn color="primary" class="mt-4">
              Salvar Configurações
            </v-btn>
          </v-form>
        </v-tabs-window-item>

        <!-- Webhook Tab -->
        <v-tabs-window-item value="webhook">
          <v-text-field
            label="Webhook URL"
            prepend-inner-icon="mdi-webhook"
            variant="outlined"
            class="mb-4"
          />
          <v-btn color="primary">
            Salvar Webhook
          </v-btn>
        </v-tabs-window-item>

        <!-- Messages Tab -->
        <v-tabs-window-item value="messages">
          <v-form>
            <v-text-field
              label="Número de Destino"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              class="mb-4"
            />
            <v-textarea
              label="Mensagem"
              prepend-inner-icon="mdi-message-text"
              variant="outlined"
              rows="4"
              class="mb-4"
            />
            <v-btn
              color="primary"
              prepend-icon="mdi-send"
            >
              Enviar Mensagem
            </v-btn>
          </v-form>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tab = ref('connection')

const instanceName = computed(() => route.params.id)

const breadcrumbs = ref([
  {
    title: 'Home',
    href: '/home',
  },
  {
    title: 'Instance',
    disabled: true,
  },
  {
    title: instanceName.value,
    disabled: true,
  },
])
</script>
