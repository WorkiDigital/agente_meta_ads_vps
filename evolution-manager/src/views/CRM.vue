<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="text-h4 gradient-text">CRM - Pipeline de Vendas</div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showLeadModal = true">
        Novo Lead
      </v-btn>
    </div>

    <!-- Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <div class="mini-stat">
          <div class="mini-stat-icon primary">
            <v-icon size="24">mdi-account-multiple</v-icon>
          </div>
          <div class="mini-stat-content">
            <span class="mini-stat-value">{{ crmStore.totalLeads }}</span>
            <span class="mini-stat-label">Total Leads</span>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <div class="mini-stat">
          <div class="mini-stat-icon success">
            <v-icon size="24">mdi-currency-usd</v-icon>
          </div>
          <div class="mini-stat-content">
            <span class="mini-stat-value">R$ {{ formatValue(crmStore.totalValue) }}</span>
            <span class="mini-stat-label">Valor Total</span>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <div class="mini-stat">
          <div class="mini-stat-icon warning">
            <v-icon size="24">mdi-fire</v-icon>
          </div>
          <div class="mini-stat-content">
            <span class="mini-stat-value">{{ crmStore.hotLeads.length }}</span>
            <span class="mini-stat-label">Leads Quentes</span>
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <div class="mini-stat">
          <div class="mini-stat-icon info">
            <v-icon size="24">mdi-chart-line</v-icon>
          </div>
          <div class="mini-stat-content">
            <span class="mini-stat-value">{{ conversionRate }}%</span>
            <span class="mini-stat-label">Taxa Conversão</span>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Empty State or Sample Data Button -->
    <v-alert v-if="crmStore.totalLeads === 0" type="info" variant="tonal" class="mb-6">
      <div class="d-flex justify-space-between align-center">
        <div>
          <strong>Nenhum lead cadastrado</strong>
          <p class="text-caption mb-0 mt-1">Crie leads de exemplo para testar o sistema</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-database-plus" @click="createSampleLeads">
          Criar Dados de Exemplo
        </v-btn>
      </div>
    </v-alert>

    <!-- Kanban Board -->
    <div class="kanban-board">
      <div class="kanban-columns">
        <div v-for="column in crmStore.columns" :key="column.id" class="kanban-column">
          <div class="column-header" :style="{ borderTopColor: column.color }">
            <span class="column-title">{{ column.name }}</span>
            <v-chip size="small">{{ crmStore.getLeadsByStage(column.id).length }}</v-chip>
          </div>
          <div class="column-content">
            <div
              v-for="lead in crmStore.getLeadsByStage(column.id)"
              :key="lead.id"
              class="lead-card glass-card"
              @click="editLead(lead)"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <strong>{{ lead.name }}</strong>
                <v-chip :color="getPriorityColor(lead.priority)" size="x-small">
                  {{ lead.priority }}
                </v-chip>
              </div>
              <div class="text-caption mb-2">{{ lead.phone }}</div>
              <div class="d-flex justify-space-between">
                <span class="text-caption">R$ {{ formatValue(lead.value) }}</span>
                <v-chip size="x-small" variant="flat">
                  <v-icon size="12" start>mdi-fire</v-icon>
                  {{ lead.score }}
                </v-chip>
              </div>
            </div>
            <div v-if="crmStore.getLeadsByStage(column.id).length === 0" class="column-empty">
              <v-icon size="32" color="grey">mdi-inbox</v-icon>
              <p class="text-caption mt-2">Nenhum lead</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lead Modal -->
    <v-dialog v-model="showLeadModal" max-width="600">
      <v-card class="glass-card">
        <v-card-title>{{ editingLead ? 'Editar Lead' : 'Novo Lead' }}</v-card-title>
        <v-card-text>
          <v-form v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="leadForm.name"
                  label="Nome"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'Campo obrigatório']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="leadForm.phone"
                  label="Telefone"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || 'Campo obrigatório']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="leadForm.email"
                  label="Email"
                  variant="outlined"
                  density="compact"
                  type="email"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="leadForm.value"
                  label="Valor"
                  variant="outlined"
                  density="compact"
                  type="number"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="leadForm.stage"
                  label="Estágio"
                  variant="outlined"
                  density="compact"
                  :items="crmStore.columns"
                  item-title="name"
                  item-value="id"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="leadForm.priority"
                  label="Prioridade"
                  variant="outlined"
                  density="compact"
                  :items="['low', 'medium', 'high']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="leadForm.score"
                  label="Score"
                  variant="outlined"
                  density="compact"
                  type="number"
                  min="0"
                  max="100"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="leadForm.source"
                  label="Origem"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="leadForm.notes"
                  label="Observações"
                  variant="outlined"
                  density="compact"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="editingLead" color="error" variant="text" @click="deleteLead">Excluir</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="closeLeadModal">Cancelar</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveLead">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCrmStore } from '@/store'

const crmStore = useCrmStore()

const showLeadModal = ref(false)
const formValid = ref(false)
const editingLead = ref(null)
const leadForm = ref({
  name: '',
  phone: '',
  email: '',
  value: 0,
  stage: 'new',
  priority: 'medium',
  score: 50,
  source: '',
  notes: '',
})

const conversionRate = computed(() => {
  const won = crmStore.getLeadsByStage('won').length
  const total = crmStore.totalLeads
  return total > 0 ? Math.round((won / total) * 100) : 0
})

const formatValue = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0)
}

const getPriorityColor = (priority) => {
  const colors = { low: 'info', medium: 'warning', high: 'error' }
  return colors[priority] || 'grey'
}

const editLead = (lead) => {
  editingLead.value = lead
  leadForm.value = { ...lead }
  showLeadModal.value = true
}

const closeLeadModal = () => {
  showLeadModal.value = false
  editingLead.value = null
  leadForm.value = {
    name: '',
    phone: '',
    email: '',
    value: 0,
    stage: 'new',
    priority: 'medium',
    score: 50,
    source: '',
    notes: '',
  }
}

const saveLead = () => {
  if (editingLead.value) {
    crmStore.updateLead(editingLead.value.id, leadForm.value)
  } else {
    crmStore.addLead(leadForm.value)
  }
  closeLeadModal()
}

const deleteLead = () => {
  if (confirm('Deseja realmente excluir este lead?')) {
    crmStore.deleteLead(editingLead.value.id)
    closeLeadModal()
  }
}

const createSampleLeads = () => {
  const samples = [
    { name: 'João Silva', phone: '11987654321', email: 'joao@example.com', value: 5000, stage: 'new', priority: 'high', score: 85, source: 'Website', notes: 'Interessado em plano premium' },
    { name: 'Maria Santos', phone: '11976543210', email: 'maria@example.com', value: 3500, stage: 'qualifying', priority: 'medium', score: 70, source: 'Instagram', notes: 'Pediu orçamento' },
    { name: 'Pedro Costa', phone: '11965432109', email: 'pedro@example.com', value: 8000, stage: 'proposal', priority: 'high', score: 90, source: 'Indicação', notes: 'Pronto para fechar' },
    { name: 'Ana Oliveira', phone: '11954321098', email: 'ana@example.com', value: 2000, stage: 'negotiation', priority: 'low', score: 50, source: 'Facebook', notes: 'Negociando desconto' },
    { name: 'Carlos Mendes', phone: '11943210987', email: 'carlos@example.com', value: 10000, stage: 'won', priority: 'high', score: 100, source: 'LinkedIn', notes: 'Cliente fechado' },
  ]
  samples.forEach(lead => crmStore.addLead(lead))
}
</script>

<style scoped>
.kanban-board {
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  min-width: min-content;
}

.kanban-column {
  flex: 0 0 300px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.column-header {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 3px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-title {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.column-content {
  padding: 12px;
  min-height: 400px;
}

.lead-card {
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.lead-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.15);
}

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  opacity: 0.5;
}
</style>
