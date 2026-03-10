<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text mb-2">Automações</h1>
        <p class="text-caption" style="color: rgba(255,255,255,0.6)">Configure respostas automáticas e fluxos</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showModal = true">
        Nova Automação
      </v-btn>
    </div>

    <!-- Automations List -->
    <v-row>
      <v-col v-for="automation in automations" :key="automation.id" cols="12" md="6">
        <v-card class="glass-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>{{ automation.name }}</span>
            <v-switch
              :model-value="automation.active"
              @change="toggleAutomation(automation.id)"
              color="primary"
              hide-details
              density="compact"
            />
          </v-card-title>
          <v-card-subtitle>{{ automation.trigger }}</v-card-subtitle>
          <v-card-text>
            <div class="mb-2">
              <strong>Condição:</strong> {{ automation.condition }}
            </div>
            <div class="mb-2">
              <strong>Ação:</strong> {{ automation.action }}
            </div>
            <v-chip size="small" :color="automation.active ? 'success' : 'grey'">
              {{ automation.active ? 'Ativa' : 'Inativa' }}
            </v-chip>
            <v-chip size="small" class="ml-2">
              {{ automation.executedCount }} execuções
            </v-chip>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" size="small" prepend-icon="mdi-pencil">Editar</v-btn>
            <v-spacer />
            <v-btn icon variant="text" size="small" color="error" @click="deleteAutomation(automation.id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal -->
    <v-dialog v-model="showModal" max-width="600">
      <v-card class="glass-card">
        <v-card-title>Nova Automação</v-card-title>
        <v-card-text>
          <v-text-field v-model="newAutomation.name" label="Nome" variant="outlined" class="mb-2" />
          <v-select
            v-model="newAutomation.trigger"
            label="Gatilho"
            :items="['Nova mensagem', 'Palavra-chave', 'Horário específico', 'Lead criado']"
            variant="outlined"
            class="mb-2"
          />
          <v-text-field v-model="newAutomation.condition" label="Condição" variant="outlined" class="mb-2" />
          <v-textarea v-model="newAutomation.action" label="Ação" variant="outlined" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showModal = false">Cancelar</v-btn>
          <v-btn color="primary" @click="addAutomation">Criar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)
const automations = ref([
  { id: 1, name: 'Boas-vindas', trigger: 'Nova mensagem', condition: 'Primeira interação', action: 'Enviar mensagem de boas-vindas', active: true, executedCount: 142 },
  { id: 2, name: 'Fora do horário', trigger: 'Horário específico', condition: 'Após 18h', action: 'Informar horário de atendimento', active: true, executedCount: 87 },
  { id: 3, name: 'Palavra "preço"', trigger: 'Palavra-chave', condition: 'Contém "preço"', action: 'Enviar tabela de preços', active: false, executedCount: 23 },
])

const newAutomation = ref({ name: '', trigger: '', condition: '', action: '', active: true, executedCount: 0 })

const toggleAutomation = (id) => {
  const automation = automations.value.find(a => a.id === id)
  if (automation) automation.active = !automation.active
}

const addAutomation = () => {
  automations.value.push({ id: Date.now(), ...newAutomation.value })
  newAutomation.value = { name: '', trigger: '', condition: '', action: '', active: true, executedCount: 0 }
  showModal.value = false
}

const deleteAutomation = (id) => {
  if (confirm('Deseja excluir esta automação?')) {
    const index = automations.value.findIndex(a => a.id === id)
    if (index !== -1) automations.value.splice(index, 1)
  }
}
</script>
