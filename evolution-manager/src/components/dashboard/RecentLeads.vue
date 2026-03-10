<template>
  <div class="recent-leads-container">
    <div class="chart-title mb-4">Leads Recentes</div>
    
    <div v-if="leads.length === 0" class="text-center py-8">
      <v-icon size="48" color="grey-darken-2">mdi-inbox</v-icon>
      <p class="text-caption mt-2" style="color: rgba(255,255,255,0.4)">Nenhum lead recente</p>
    </div>

    <div v-else class="leads-list">
      <div
        v-for="lead in leads"
        :key="lead.id"
        class="lead-item"
        @click="$emit('click-lead', lead)"
      >
        <div class="lead-avatar" :style="{ background: lead.color }">
          {{ getInitials(lead.name) }}
        </div>
        <div class="lead-info">
          <div class="lead-name">{{ lead.name }}</div>
          <div class="lead-message">{{ lead.status || lead.message }}</div>
        </div>
        <div class="lead-time">{{ lead.time }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  leads: { type: Array, default: () => [] },
})

defineEmits(['click-lead'])

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}
</script>

<style scoped>
.leads-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
