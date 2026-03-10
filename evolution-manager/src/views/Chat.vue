<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text mb-2">Chat WhatsApp</h1>
        <p class="text-caption" style="color: rgba(255,255,255,0.6)">Conversas ativas</p>
      </div>
      <v-chip color="success" prepend-icon="mdi-circle">12 ativos</v-chip>
    </div>

    <v-row>
      <!-- Contacts List -->
      <v-col cols="12" md="4">
        <v-card class="glass-card" style="height: 600px; overflow-y: auto">
          <v-card-title class="pb-2">
            <v-text-field
              v-model="searchContact"
              prepend-inner-icon="mdi-magnify"
              label="Buscar contato"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-card-title>
          <v-list>
            <v-list-item
              v-for="contact in contacts"
              :key="contact.id"
              :active="selectedContact?.id === contact.id"
              @click="selectContact(contact)"
            >
              <template #prepend>
                <v-avatar :color="contact.color" size="40">
                  {{ getInitials(contact.name) }}
                </v-avatar>
              </template>
              <v-list-item-title>{{ contact.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ contact.lastMessage }}</v-list-item-subtitle>
              <template #append>
                <v-chip v-if="contact.unread" size="x-small" color="primary">{{ contact.unread }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Chat Area -->
      <v-col cols="12" md="8">
        <v-card v-if="selectedContact" class="glass-card" style="height: 600px; display: flex; flex-direction: column">
          <v-card-title class="d-flex align-center pa-4" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
            <v-avatar :color="selectedContact.color" size="40">
              {{ getInitials(selectedContact.name) }}
            </v-avatar>
            <div class="ml-3">
              <div class="text-body-1 font-weight-bold">{{ selectedContact.name }}</div>
              <div class="text-caption" style="color: rgba(255,255,255,0.5)">{{ selectedContact.phone }}</div>
            </div>
          </v-card-title>

          <!-- Messages -->
          <v-card-text class="flex-grow-1" style="overflow-y: auto">
            <div v-for="msg in messages" :key="msg.id" class="mb-3" :class="msg.sent ? 'text-right' : 'text-left'">
              <div
                class="d-inline-block pa-3 rounded-lg"
                :style="{
                  background: msg.sent ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  maxWidth: '70%',
                  textAlign: 'left'
                }"
              >
                <div>{{ msg.text }}</div>
                <div class="text-caption mt-1" style="opacity: 0.6">{{ msg.time }}</div>
              </div>
            </div>
          </v-card-text>

          <!-- Input -->
          <v-card-actions class="pa-4" style="border-top: 1px solid rgba(255,255,255,0.06)">
            <v-text-field
              v-model="newMessage"
              placeholder="Digite sua mensagem..."
              variant="outlined"
              density="compact"
              hide-details
              @keyup.enter="sendMessage"
            >
              <template #append-inner>
                <v-btn icon size="small" @click="sendMessage">
                  <v-icon>mdi-send</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-card-actions>
        </v-card>

        <v-card v-else class="glass-card" style="height: 600px; display: flex; align-items: center; justify-content: center">
          <div class="text-center">
            <v-icon size="64" color="grey">mdi-message-text</v-icon>
            <p class="text-h6 mt-4">Selecione um contato para iniciar</p>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const searchContact = ref('')
const selectedContact = ref(null)
const newMessage = ref('')

const contacts = ref([
  { id: 1, name: 'João Silva', phone: '11987654321', lastMessage: 'Obrigado!', unread: 2, color: '#a855f7' },
  { id: 2, name: 'Maria Santos', phone: '11976543210', lastMessage: 'Sim, pode enviar', unread: 0, color: '#ec4899' },
  { id: 3, name: 'Pedro Costa', phone: '11965432109', lastMessage: 'Quando podemos conversar?', unread: 1, color: '#06b6d4' },
])

const messages = ref([
  { id: 1, text: 'Olá! Gostaria de saber mais sobre os planos', sent: false, time: '10:30' },
  { id: 2, text: 'Claro! Temos planos a partir de R$ 99/mês', sent: true, time: '10:32' },
  { id: 3, text: 'Obrigado!', sent: false, time: '10:35' },
])

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

const selectContact = (contact) => {
  selectedContact.value = contact
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({
      id: Date.now(),
      text: newMessage.value,
      sent: true,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    })
    newMessage.value = ''
  }
}
</script>
