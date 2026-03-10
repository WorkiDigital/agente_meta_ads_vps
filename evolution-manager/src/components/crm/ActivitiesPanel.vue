<template>
  <div>
    <div class="glass-card pa-6">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6">Atividades e Tarefas</h3>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          size="small"
        >
          Nova Atividade
        </v-btn>
      </div>

      <v-list class="bg-transparent">
        <v-list-item
          v-for="i in 5"
          :key="i"
          class="activity-item mb-2"
        >
          <template v-slot:prepend>
            <v-checkbox hide-details />
          </template>

          <v-list-item-title>
            Ligar para lead #{{ i }}
          </v-list-item-title>

          <v-list-item-subtitle>
            Prazo: Hoje, 15:00
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-chip size="small" color="warning">
              Pendente
            </v-chip>
          </template>
        </v-list-item>
      </v-list>

      <div v-if="false" class="text-center pa-8">
        <v-icon size="64" color="grey">mdi-clipboard-check-outline</v-icon>
        <p class="text-caption mt-2">Nenhuma atividade pendente</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.activity-item {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px;
}
</style>
