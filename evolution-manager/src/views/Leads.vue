<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text mb-2">Leads</h1>
        <p class="text-caption" style="color: rgba(255,255,255,0.6)">Lista completa de leads</p>
      </div>
      <div class="d-flex gap-2">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 300px"
        />
        <v-btn color="primary" prepend-icon="mdi-plus" to="/crm">
          Ver Funil
        </v-btn>
      </div>
    </div>

    <!-- Leads Table -->
    <v-card class="glass-card">
      <v-table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Valor</th>
            <th>Estágio</th>
            <th>Score</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in filteredLeads" :key="lead.id">
            <td>{{ lead.name }}</td>
            <td>{{ lead.phone }}</td>
            <td>{{ lead.email || '-' }}</td>
            <td>R$ {{ formatValue(lead.value) }}</td>
            <td>
              <v-chip size="small" :color="getStageColor(lead.stage)">
                {{ getStageLabel(lead.stage) }}
              </v-chip>
            </td>
            <td>
              <v-chip size="small" variant="outlined">
                <v-icon size="12" start>mdi-fire</v-icon>
                {{ lead.score }}
              </v-chip>
            </td>
            <td>
              <v-btn icon variant="text" size="small" @click="editLead(lead)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon variant="text" size="small" color="error" @click="deleteLead(lead.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <div v-if="filteredLeads.length === 0" class="text-center py-12">
      <v-icon size="64" color="grey">mdi-account-group</v-icon>
      <p class="text-h6 mt-4">Nenhum lead encontrado</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCrmStore } from '@/store'
import { useRouter } from 'vue-router'

const crmStore = useCrmStore()
const router = useRouter()
const search = ref('')

const filteredLeads = computed(() => {
  const query = search.value.toLowerCase()
  return crmStore.getAllLeads.filter(lead =>
    lead.name.toLowerCase().includes(query) ||
    lead.phone.includes(query) ||
    (lead.email && lead.email.toLowerCase().includes(query))
  )
})

const formatValue = (value) => new Intl.NumberFormat('pt-BR').format(value || 0)

const getStageLabel = (stage) => {
  const labels = {
    new: 'Novo',
    qualifying: 'Qualificando',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    won: 'Fechado',
  }
  return labels[stage] || stage
}

const getStageColor = (stage) => {
  const colors = {
    new: 'info',
    qualifying: 'warning',
    proposal: 'purple',
    negotiation: 'orange',
    won: 'success',
  }
  return colors[stage] || 'grey'
}

const editLead = (lead) => {
  router.push('/crm')
}

const deleteLead = (id) => {
  if (confirm('Deseja excluir este lead?')) {
    crmStore.deleteLead(id)
  }
}
</script>
