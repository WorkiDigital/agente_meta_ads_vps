<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text mb-2">Dashboard</h1>
        <p class="text-caption" style="color: rgba(255,255,255,0.6)">Visão geral do seu negócio</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-refresh" variant="tonal">
        Atualizar
      </v-btn>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="Total de Leads"
          icon="mdi-account-multiple"
          :value="stats.totalLeads"
          icon-color="primary"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="Mensagens Ativas"
          icon="mdi-message-text"
          :value="stats.activeMessages"
          icon-color="info"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="Taxa Conversão"
          icon="mdi-chart-line"
          :value="stats.conversionRate"
          suffix="%"
          icon-color="success"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="Novos Hoje"
          icon="mdi-account-plus"
          :value="stats.newToday"
          icon-color="warning"
        />
      </v-col>
    </v-row>

    <!-- Charts and Recent Activity -->
    <v-row>
      <v-col cols="12" lg="8">
        <ChartLine
          title="Fluxo de Mensagens"
          :data="messagesData"
        />
      </v-col>
      <v-col cols="12" lg="4">
        <RecentLeads :leads="recentLeads" @click-lead="openLead" />
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <div class="mt-6">
      <h3 class="text-h6 mb-4">Ações Rápidas</h3>
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="glass-card pa-4 text-center" style="cursor: pointer" @click="$router.push('/crm')">
            <v-icon size="40" color="primary" class="mb-2">mdi-filter-variant</v-icon>
            <div class="text-body-2 font-weight-bold">Ver Funil</div>
            <div class="text-caption" style="color: rgba(255,255,255,0.5)">{{ crmStore.totalLeads }} leads</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="glass-card pa-4 text-center" style="cursor: pointer" @click="showCreateModal = true">
            <v-icon size="40" color="success" class="mb-2">mdi-plus-circle</v-icon>
            <div class="text-body-2 font-weight-bold">Nova Instância</div>
            <div class="text-caption" style="color: rgba(255,255,255,0.5)">Criar conexão</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="glass-card pa-4 text-center" style="cursor: pointer">
            <v-icon size="40" color="info" class="mb-2">mdi-message-plus</v-icon>
            <div class="text-body-2 font-weight-bold">Nova Campanha</div>
            <div class="text-caption" style="color: rgba(255,255,255,0.5)">Enviar mensagens</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="glass-card pa-4 text-center" style="cursor: pointer">
            <v-icon size="40" color="warning" class="mb-2">mdi-robot</v-icon>
            <div class="text-body-2 font-weight-bold">Automações</div>
            <div class="text-caption" style="color: rgba(255,255,255,0.5)">Configurar bot</div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Create Instance Modal -->
    <v-dialog v-model="showCreateModal" max-width="500">
      <v-card class="glass-card">
        <v-card-title>Nova Instância</v-card-title>
        <v-card-text>
          <v-form v-model="formValid">
            <v-text-field
              v-model="newInstance.name"
              label="Nome da Instância"
              variant="outlined"
              :rules="[v => !!v || 'Campo obrigatório']"
              class="mb-2"
            />
            <v-text-field
              v-model="newInstance.owner"
              label="Número do Proprietário"
              variant="outlined"
              :rules="[v => !!v || 'Campo obrigatório']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCreateModal = false">Cancelar</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="createInstance">Criar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore, useCrmStore } from '@/store'
import StatCard from '@/components/dashboard/StatCard.vue'
import ChartLine from '@/components/dashboard/ChartLine.vue'
import RecentLeads from '@/components/dashboard/RecentLeads.vue'

const appStore = useAppStore()
const crmStore = useCrmStore()

const showCreateModal = ref(false)
const formValid = ref(false)
const newInstance = ref({ name: '', owner: '' })

// Stats
const stats = computed(() => ({
  totalLeads: crmStore.totalLeads,
  activeMessages: 847,
  conversionRate: crmStore.totalLeads > 0 
    ? Math.round((crmStore.getLeadsByStage('won').length / crmStore.totalLeads) * 100) 
    : 0,
  newToday: 18,
}))

// Messages data for chart
const messagesData = ref([120, 250, 180, 420, 350, 280, 520])

// Recent leads
const recentLeads = ref([
  {
    id: 1,
    name: 'João Silva',
    message: 'Interessado no plano premium',
    status: 'Em atendimento',
    time: 'há 5 min',
    color: '#a855f7',
  },
  {
    id: 2,
    name: 'Maria Santos',
    message: 'Pediu orçamento',
    status: 'Novo lead',
    time: 'há 12 min',
    color: '#ec4899',
  },
  {
    id: 3,
    name: 'Pedro Costa',
    message: 'Pronto para fechar',
    status: 'Negociação',
    time: 'há 25 min',
    color: '#06b6d4',
  },
  {
    id: 4,
    name: 'Ana Oliveira',
    message: 'Aguardando proposta',
    status: 'Qualificando',
    time: 'há 1h',
    color: '#fbbf24',
  },
  {
    id: 5,
    name: 'Carlos Mendes',
    message: 'Cliente fechado',
    status: 'Concluído',
    time: 'há 2h',
    color: '#25D366',
  },
])

const createInstance = () => {
  appStore.addInstance(newInstance.value)
  newInstance.value = { name: '', owner: '' }
  showCreateModal.value = false
}

const openLead = (lead) => {
  console.log('Open lead:', lead)
  // Navigate to lead details or open modal
}
</script>
