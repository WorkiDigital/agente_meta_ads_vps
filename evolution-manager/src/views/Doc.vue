<template>
  <div>
    <h2 class="text-h4 mb-6">Documentação</h2>
    
    <v-row>
      <v-col cols="12" md="6">
        <div class="glass-card pa-6">
          <h3 class="text-h5 mb-4">Bem-vindo ao Evolution Manager</h3>
          <p class="mb-4">
            O Evolution Manager é uma plataforma completa para gerenciar suas instâncias WhatsApp através da Evolution API.
          </p>
          <h4 class="text-h6 mb-2">Recursos Principais:</h4>
          <ul class="mb-4">
            <li>Gerenciamento de múltiplas instâncias</li>
            <li>CRM integrado com Kanban</li>
            <li>Analytics e relatórios</li>
            <li>Automações de mensagens</li>
            <li>Webhooks configuráveis</li>
          </ul>
        </div>
      </v-col>
      
      <v-col cols="12" md="6">
        <div class="glass-card pa-6">
          <h3 class="text-h5 mb-4">Como Começar</h3>
          <v-timeline density="compact" align="start">
            <v-timeline-item
              dot-color="primary"
              size="small"
            >
              <strong>1. Configure a Conexão</strong>
              <p class="text-caption">Insira a URL e API Key da Evolution API</p>
            </v-timeline-item>
            <v-timeline-item
              dot-color="primary"
              size="small"
            >
              <strong>2. Crie uma Instância</strong>
              <p class="text-caption">Adicione uma nova instância WhatsApp</p>
            </v-timeline-item>
            <v-timeline-item
              dot-color="primary"
              size="small"
            >
              <strong>3. Escaneie o QR Code</strong>
              <p class="text-caption">Conecte seu WhatsApp</p>
            </v-timeline-item>
            <v-timeline-item
              dot-color="primary"
              size="small"
            >
              <strong>4. Comece a Usar</strong>
              <p class="text-caption">Gerencie leads no CRM e envie mensagens</p>
            </v-timeline-item>
          </v-timeline>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
</script>
