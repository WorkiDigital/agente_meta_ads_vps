<template>
  <div>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold gradient-text mb-2">Configurações</h1>
      <p class="text-caption" style="color: rgba(255,255,255,0.6)">Configure sua conta e preferências</p>
    </div>

    <v-row>
      <v-col cols="12" md="3">
        <v-list class="glass-card">
          <v-list-item
            v-for="item in menuItems"
            :key="item.value"
            :active="activeTab === item.value"
            @click="activeTab = item.value"
          >
            <template #prepend>
              <v-icon>{{ item.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="9">
        <v-card class="glass-card">
          <!-- Profile Settings -->
          <div v-if="activeTab === 'profile'">
            <v-card-title>Perfil</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" class="text-center mb-4">
                  <v-avatar color="primary" size="100">
                    <v-icon size="50">mdi-account</v-icon>
                  </v-avatar>
                  <div class="mt-2">
                    <v-btn variant="text" size="small">Alterar Foto</v-btn>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Nome" value="Admin" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Email" value="admin@example.com" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Telefone" value="+55 11 99999-9999" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Cargo" value="Administrador" variant="outlined" />
                </v-col>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary">Salvar Alterações</v-btn>
            </v-card-actions>
          </div>

          <!-- API Settings -->
          <div v-if="activeTab === 'api'">
            <v-card-title>Conexão Evolution API</v-card-title>
            <v-card-text>
              <v-text-field
                label="URL da API"
                :model-value="appStore.connection.url"
                variant="outlined"
                readonly
                class="mb-2"
              />
              <v-text-field
                label="API Key"
                type="password"
                :model-value="appStore.connection.apikey"
                variant="outlined"
                readonly
                class="mb-2"
              />
              <v-alert type="info" variant="tonal">
                Status: {{ appStore.isConnected ? 'Conectado' : 'Desconectado' }}
              </v-alert>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="error" variant="text" @click="appStore.disconnect()">Desconectar</v-btn>
            </v-card-actions>
          </div>

          <!-- Notifications Settings -->
          <div v-if="activeTab === 'notifications'">
            <v-card-title>Notificações</v-card-title>
            <v-card-text>
              <v-switch label="Notificações de novas mensagens" color="primary" />
              <v-switch label="Notificações de novos leads" color="primary" />
              <v-switch label="Relatórios diários" color="primary" />
              <v-switch label="Alertas de campanha" color="primary" />
            </v-card-text>
          </div>

          <!-- Appearance Settings -->
          <div v-if="activeTab === 'appearance'">
            <v-card-title>Aparência</v-card-title>
            <v-card-text>
              <v-select
                label="Tema"
                :items="['Dark (Nexus)', 'Light', 'Auto']"
                variant="outlined"
                model-value="Dark (Nexus)"
                class="mb-4"
              />
              <v-select
                label="Cor Principal"
                :items="['Roxo (#a855f7)', 'Azul', 'Verde']"
                variant="outlined"
                model-value="Roxo (#a855f7)"
              />
            </v-card-text>
          </div>

          <!-- Security Settings -->
          <div v-if="activeTab === 'security'">
            <v-card-title>Segurança</v-card-title>
            <v-card-text>
              <v-text-field label="Senha Atual" type="password" variant="outlined" class="mb-2" />
              <v-text-field label="Nova Senha" type="password" variant="outlined" class="mb-2" />
              <v-text-field label="Confirmar Nova Senha" type="password" variant="outlined" />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary">Alterar Senha</v-btn>
            </v-card-actions>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/store'

const appStore = useAppStore()
const activeTab = ref('profile')

const menuItems = ref([
  { title: 'Perfil', value: 'profile', icon: 'mdi-account' },
  { title: 'Conexão API', value: 'api', icon: 'mdi-api' },
  { title: 'Notificações', value: 'notifications', icon: 'mdi-bell' },
  { title: 'Aparência', value: 'appearance', icon: 'mdi-palette' },
  { title: 'Segurança', value: 'security', icon: 'mdi-shield-lock' },
])
</script>
