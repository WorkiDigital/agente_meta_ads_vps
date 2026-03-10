<template>
  <div class="lead-card glass-card" @click="$emit('click')">
    <div class="d-flex justify-space-between align-center mb-2">
      <v-chip
        :color="getPriorityColor(lead.priority)"
        size="x-small"
        variant="flat"
      >
        {{ lead.priority || 'medium' }}
      </v-chip>
      <div class="d-flex align-center gap-1">
        <v-icon size="14" :color="getScoreColor(lead.score)">
          mdi-fire
        </v-icon>
        <span class="text-caption">{{ lead.score || 50 }}</span>
      </div>
    </div>

    <h4 class="lead-name">{{ lead.name }}</h4>
    <p class="lead-phone">{{ formatPhone(lead.phone) }}</p>

    <div class="lead-value mt-3 mb-3">
      <span class="text-success font-weight-bold">
        {{ formatCurrency(lead.value) }}
      </span>
    </div>

    <div class="d-flex align-center justify-space-between">
      <div class="d-flex align-center gap-1">
        <v-icon size="14" color="grey">mdi-clock-outline</v-icon>
        <span class="text-caption">{{ formatDate(lead.updatedAt) }}</span>
      </div>
      <v-avatar size="24" color="primary">
        <span class="text-caption">{{ getInitials(lead.name) }}</span>
      </v-avatar>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency, formatDate, formatPhone } from '@/helpers/formatters'

defineProps({
  lead: {
    type: Object,
    required: true,
  },
})

defineEmits(['click'])

const getPriorityColor = (priority) => {
  const colors = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  }
  return colors[priority] || 'grey'
}

const getScoreColor = (score) => {
  if (score >= 80) return 'error'
  if (score >= 50) return 'warning'
  return 'info'
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
.lead-card {
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lead-card:hover {
  transform: translateY(-2px);
}

.lead-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #fff;
}

.lead-phone {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.lead-value {
  font-size: 18px;
}
</style>
