<template>
  <div class="instance-card">
    <div class="card-status-indicator" :class="statusData.class"></div>
    
    <div class="card-content">
      <!-- Avatar -->
      <div class="instance-avatar" :class="statusData.class">
        <v-icon size="32" :color="statusData.iconColor">
          {{ statusData.icon }}
        </v-icon>
      </div>

      <!-- Info -->
      <div class="instance-info">
        <v-chip
          :color="statusData.chipColor"
          size="small"
          class="status-badge mb-2"
        >
          {{ $t(`status.${instance.instance.state}`) }}
        </v-chip>
        <h4 class="instance-name">{{ instance.instance.instanceName }}</h4>
        <p class="instance-owner">{{ instance.instance.owner || 'No owner' }}</p>
      </div>

      <!-- Actions -->
      <div class="card-actions mt-4">
        <v-btn
          variant="flat"
          color="primary"
          size="small"
          prepend-icon="mdi-account-group"
          @click="goToCRM"
          block
        >
          {{ $t('actions.crm') }}
        </v-btn>
        <div class="d-flex gap-2 mt-2">
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-cog"
            @click="goToInstance"
            block
          >
            Manage
          </v-btn>
          <v-btn
            variant="outlined"
            color="error"
            size="small"
            icon="mdi-delete"
            @click="confirmDelete"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="card-footer mt-3 pt-3">
      <div class="d-flex justify-space-between align-center">
        <div class="d-flex align-center gap-1">
          <v-icon size="16" color="grey">mdi-account-multiple</v-icon>
          <span class="text-caption">{{ leadCount }} leads</span>
        </div>
        <div class="text-caption text-grey">
          {{ formatDate(instance.instance.createdAt) }}
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Deletar Instância"
      :message="`Tem certeza que deseja deletar a instância ${instance.instance.instanceName}?`"
      @confirm="deleteInstance"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, useCrmStore } from '@/store'
import { formatDate } from '@/helpers/formatters'
import ConfirmDialog from '@/components/modal/ConfirmDialog.vue'

const props = defineProps({
  instance: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['refresh'])

const router = useRouter()
const appStore = useAppStore()
const crmStore = useCrmStore()

const deleteDialog = ref(false)

const statusData = computed(() => {
  const state = props.instance.instance.state
  
  const statusMap = {
    open: {
      class: 'open',
      icon: 'mdi-check-circle',
      iconColor: 'success',
      chipColor: 'success',
    },
    close: {
      class: 'close',
      icon: 'mdi-close-circle',
      iconColor: 'error',
      chipColor: 'error',
    },
    connecting: {
      class: 'connecting',
      icon: 'mdi-loading',
      iconColor: 'warning',
      chipColor: 'warning',
    },
  }

  return statusMap[state] || statusMap.close
})

const leadCount = computed(() => {
  return crmStore.getLeadsByInstance(props.instance.instance.instanceName).length
})

const goToInstance = () => {
  router.push(`/instance/${props.instance.instance.instanceName}`)
}

const goToCRM = () => {
  router.push('/crm')
}

const confirmDelete = () => {
  deleteDialog.value = true
}

const deleteInstance = async () => {
  try {
    await appStore.deleteInstance(props.instance.instance.instanceName)
    emit('refresh')
  } catch (error) {
    console.error('Delete error:', error)
  }
}
</script>

<style scoped>
.card-content {
  margin-top: 24px;
}

.card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.card-actions {
  display: flex;
  flex-direction: column;
}
</style>
