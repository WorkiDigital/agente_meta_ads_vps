<template>
  <div class="kanban-board">
    <div class="kanban-columns">
      <div
        v-for="column in columns"
        :key="column.id"
        class="kanban-column"
      >
        <!-- Column Header -->
        <div class="column-header" :style="{ borderTopColor: column.color }">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <div
                class="column-indicator"
                :style="{ background: column.color }"
              />
              <span class="column-title">{{ column.name }}</span>
            </div>
            <v-chip size="small" variant="flat">
              {{ getLeadsByStage(column.id).length }}
            </v-chip>
          </div>
        </div>

        <!-- Column Content -->
        <div class="column-content">
          <transition-group name="list">
            <LeadCard
              v-for="lead in getLeadsByStage(column.id)"
              :key="lead.id"
              :lead="lead"
              @click="openLead(lead)"
            />
          </transition-group>

          <!-- Empty State -->
          <div v-if="getLeadsByStage(column.id).length === 0" class="column-empty">
            <v-icon size="48" color="grey-darken-1">mdi-inbox</v-icon>
            <p class="text-caption mt-2">Nenhum lead</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCrmStore } from '@/store'
import LeadCard from './LeadCard.vue'

const crmStore = useCrmStore()

const emit = defineEmits(['openLead'])

const columns = computed(() => crmStore.columns)

const getLeadsByStage = (stage) => {
  return crmStore.getLeadsByStage(stage)
}

const openLead = (lead) => {
  emit('openLead', lead)
}
</script>

<style scoped>
.kanban-board {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  min-width: min-content;
}

.kanban-column {
  flex: 0 0 320px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.column-header {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 3px solid;
  backdrop-filter: blur(10px);
}

.column-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.column-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.column-content {
  padding: 12px;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  opacity: 0.5;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
