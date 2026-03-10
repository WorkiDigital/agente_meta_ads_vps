<template>
  <div>
    <div class="glass-card pa-6">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6">Automações</h3>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="small"
        >
          Nova Automação
        </v-btn>
      </div>

      <v-list class="bg-transparent">
        <v-list-item class="automation-item mb-3">
          <template v-slot:prepend>
            <v-icon color="primary">mdi-robot</v-icon>
          </template>

          <v-list-item-title>
            Mensagem de Boas-vindas
          </v-list-item-title>

          <v-list-item-subtitle>
            Quando: Lead entra em "Novo" → Enviar mensagem automática
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-switch
              color="success"
              hide-details
              density="compact"
              :model-value="true"
            />
          </template>
        </v-list-item>

        <v-list-item class="automation-item mb-3">
          <template v-slot:prepend>
            <v-icon color="success">mdi-robot</v-icon>
          </template>

          <v-list-item-title>
            Follow-up Automático
          </v-list-item-title>

          <v-list-item-subtitle>
            Quando: 3 dias sem interação → Enviar follow-up
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-switch
              color="success"
              hide-details
              density="compact"
              :model-value="false"
            />
          </template>
        </v-list-item>

        <v-list-item class="automation-item">
          <template v-slot:prepend>
            <v-icon color="warning">mdi-robot</v-icon>
          </template>

          <v-list-item-title>
            Notificação Lead Quente
          </v-list-item-title>

          <v-list-item-subtitle>
            Quando: Score > 80 → Notificar equipe de vendas
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-switch
              color="success"
              hide-details
              density="compact"
              :model-value="true"
            />
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.automation-item {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px;
}
</style>
