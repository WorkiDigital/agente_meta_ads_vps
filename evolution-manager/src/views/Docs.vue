<template>
  <div>
    <div class="text-h4 mb-6 gradient-text">Documentação</div>
    
    <v-card class="glass-card mb-4">
      <v-card-title>Bem-vindo ao Evolution Manager</v-card-title>
      <v-card-text>
        <p class="mb-4">Sistema completo de gerenciamento de instâncias WhatsApp e CRM integrado.</p>
        
        <v-list>
          <v-list-item>
            <template #prepend>
              <v-icon color="success">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Gerenciamento de Instâncias WhatsApp</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="success">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>CRM com Pipeline Kanban</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="success">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Gestão de Leads e Oportunidades</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="success">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>Interface Premium com Dark Mode</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-card class="glass-card">
      <v-card-title>Como Começar</v-card-title>
      <v-card-text>
        <v-timeline side="end" density="compact">
          <v-timeline-item dot-color="primary">
            <strong>1. Conectar à API</strong>
            <p class="text-caption">Configure a URL e API Key da Evolution API</p>
          </v-timeline-item>
          <v-timeline-item dot-color="primary">
            <strong>2. Criar Instância</strong>
            <p class="text-caption">Adicione uma nova instância WhatsApp</p>
          </v-timeline-item>
          <v-timeline-item dot-color="primary">
            <strong>3. Gerenciar CRM</strong>
            <p class="text-caption">Adicione leads e gerencie seu pipeline de vendas</p>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>
  </div>
</template>
