<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text mb-2">Campanhas</h1>
        <p class="text-caption" style="color: rgba(255,255,255,0.6)">Mensagens em massa e campanhas de marketing</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showModal = true">
        Nova Campanha
      </v-btn>
    </div>

    <!-- Campaigns Grid -->
    <v-row>
      <v-col v-for="campaign in campaigns" :key="campaign.id" cols="12" md="6" lg="4">
        <v-card class="glass-card">
          <v-card-title>{{ campaign.name }}</v-card-title>
          <v-card-text>
            <div class="mb-3">
              <div class="text-caption" style="color: rgba(255,255,255,0.6)">Status</div>
              <v-chip size="small" :color="getStatusColor(campaign.status)">{{ campaign.status }}</v-chip>
            </div>
            <div class="mb-2">
              <div class="text-caption" style="color: rgba(255,255,255,0.6)">Destinatários</div>
              <div class="font-weight-bold">{{ campaign.recipients }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption" style="color: rgba(255,255,255,0.6)">Enviadas</div>
              <v-progress-linear :model-value="(campaign.sent / campaign.recipients) * 100" color="primary" height="20" rounded>
                <strong>{{ campaign.sent }} / {{ campaign.recipients }}</strong>
              </v-progress-linear>
            </div>
            <div class="mb-2">
              <div class="text-caption" style="color: rgba(255,255,255,0.6)">Taxa de Abertura</div>
              <div class="font-weight-bold">{{ campaign.openRate }}%</div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" size="small" prepend-icon="mdi-eye">Ver</v-btn>
            <v-spacer />
            <v-btn v-if="campaign.status === 'rascunho'" variant="text" size="small" color="success" prepend-icon="mdi-send">
              Enviar
            </v-btn>
            <v-btn icon variant="text" size="small" color="error" @click="deleteCampaign(campaign.id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal -->
    <v-dialog v-model="showModal" max-width="700">
      <v-card class="glass-card">
        <v-card-title>Nova Campanha</v-card-title>
        <v-card-text>
          <v-text-field v-model="newCampaign.name" label="Nome da Campanha" variant="outlined" class="mb-2" />
          <v-select
            v-model="newCampaign.target"
            label="Público Alvo"
            :items="['Todos os leads', 'Leads quentes', 'Novos leads', 'Clientes ativos']"
            variant="outlined"
            class="mb-2"
          />
          <v-textarea v-model="newCampaign.message" label="Mensagem" variant="outlined" rows="4" class="mb-2" />
          <v-text-field v-model="newCampaign.scheduleDate" label="Agendar para" type="datetime-local" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showModal = false">Cancelar</v-btn>
          <v-btn color="grey" @click="saveDraft">Salvar Rascunho</v-btn>
          <v-btn color="primary" @click="createCampaign">Criar e Enviar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)
const campaigns = ref([
  { id: 1, name: 'Promoção Black Friday', status: 'concluída', recipients: 500, sent: 500, openRate: 68 },
  { id: 2, name: 'Lançamento Produto', status: 'em andamento', recipients: 250, sent: 180, openRate: 42 },
  { id: 3, name: 'Follow-up Leads', status: 'rascunho', recipients: 120, sent: 0, openRate: 0 },
])

const newCampaign = ref({ name: '', target: '', message: '', scheduleDate: '' })

const getStatusColor = (status) => {
  const colors = { 'concluída': 'success', 'em andamento': 'warning', 'rascunho': 'grey' }
  return colors[status] || 'grey'
}

const createCampaign = () => {
  campaigns.value.push({
    id: Date.now(),
    ...newCampaign.value,
    status: 'em andamento',
    recipients: 100,
    sent: 0,
    openRate: 0,
  })
  newCampaign.value = { name: '', target: '', message: '', scheduleDate: '' }
  showModal.value = false
}

const saveDraft = () => {
  campaigns.value.push({
    id: Date.now(),
    ...newCampaign.value,
    status: 'rascunho',
    recipients: 100,
    sent: 0,
    openRate: 0,
  })
  newCampaign.value = { name: '', target: '', message: '', scheduleDate: '' }
  showModal.value = false
}

const deleteCampaign = (id) => {
  if (confirm('Deseja excluir esta campanha?')) {
    const index = campaigns.value.findIndex(c => c.id === id)
    if (index !== -1) campaigns.value.splice(index, 1)
  }
}
</script>
