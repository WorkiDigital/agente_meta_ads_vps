<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text mb-2">Respostas Rápidas</h1>
        <p class="text-caption" style="color: rgba(255,255,255,0.6)">Mensagens pré-configuradas para agilizar o atendimento</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showModal = true">
        Nova Resposta
      </v-btn>
    </div>

    <!-- Quick Replies Grid -->
    <v-row>
      <v-col v-for="reply in replies" :key="reply.id" cols="12" md="6" lg="4">
        <v-card class="glass-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>{{ reply.title }}</span>
            <v-chip size="small" :color="reply.category === 'saudacao' ? 'success' : 'info'">
              {{ reply.category }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <div class="text-body-2 mb-3">{{ reply.message }}</div>
            <div class="text-caption" style="color: rgba(255,255,255,0.5)">
              Atalho: <code class="pa-1" style="background: rgba(255,255,255,0.1); border-radius: 4px">/{{ reply.shortcut }}</code>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" size="small" prepend-icon="mdi-content-copy">Copiar</v-btn>
            <v-spacer />
            <v-btn icon variant="text" size="small">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon variant="text" size="small" color="error" @click="deleteReply(reply.id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal -->
    <v-dialog v-model="showModal" max-width="600">
      <v-card class="glass-card">
        <v-card-title>Nova Resposta Rápida</v-card-title>
        <v-card-text>
          <v-text-field v-model="newReply.title" label="Título" variant="outlined" class="mb-2" />
          <v-textarea v-model="newReply.message" label="Mensagem" variant="outlined" rows="4" class="mb-2" />
          <v-text-field v-model="newReply.shortcut" label="Atalho" variant="outlined" class="mb-2" prefix="/" />
          <v-select
            v-model="newReply.category"
            label="Categoria"
            :items="['saudacao', 'despedida', 'informacao', 'vendas']"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showModal = false">Cancelar</v-btn>
          <v-btn color="primary" @click="addReply">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)
const replies = ref([
  { id: 1, title: 'Saudação Inicial', message: 'Olá! 👋 Como posso ajudá-lo hoje?', shortcut: 'oi', category: 'saudacao' },
  { id: 2, title: 'Horário Atendimento', message: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.', shortcut: 'horario', category: 'informacao' },
  { id: 3, title: 'Despedida', message: 'Obrigado pelo contato! Tenha um ótimo dia! 😊', shortcut: 'tchau', category: 'despedida' },
  { id: 4, title: 'Preços', message: 'Nossos planos começam em R$ 99/mês. Posso enviar mais detalhes!', shortcut: 'preco', category: 'vendas' },
])

const newReply = ref({ title: '', message: '', shortcut: '', category: 'informacao' })

const addReply = () => {
  replies.value.push({ id: Date.now(), ...newReply.value })
  newReply.value = { title: '', message: '', shortcut: '', category: 'informacao' }
  showModal.value = false
}

const deleteReply = (id) => {
  if (confirm('Deseja excluir esta resposta rápida?')) {
    const index = replies.value.findIndex(r => r.id === id)
    if (index !== -1) replies.value.splice(index, 1)
  }
}
</script>
