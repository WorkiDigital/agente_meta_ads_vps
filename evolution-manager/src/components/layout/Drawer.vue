<template>
  <v-navigation-drawer permanent width="260" class="drawer elevation-4">
    <!-- User Profile Section -->
    <div class="pa-4 d-flex align-center" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
      <v-avatar color="primary" size="40">
        <v-icon>mdi-account</v-icon>
      </v-avatar>
      <div class="ml-3">
        <div class="text-body-2 font-weight-bold">Usuário</div>
        <div class="text-caption" style="color: rgba(255,255,255,0.5)">Admin</div>
      </div>
    </div>

    <!-- Nova Conexão Button -->
    <div class="pa-3">
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        block
        class="glow-purple-sm"
      >
        Nova Conexão
      </v-btn>
    </div>

    <!-- Navigation Menu -->
    <v-list nav density="compact" class="py-0">
      <v-list-item
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        :prepend-icon="item.icon"
        :title="item.title"
        rounded="xl"
        class="mx-2 my-1"
      >
        <template v-if="item.badge" #append>
          <v-badge :content="item.badge" color="error" inline />
        </template>
      </v-list-item>
    </v-list>

    <!-- Bottom Section -->
    <template #append>
      <div class="pa-3" style="border-top: 1px solid rgba(255,255,255,0.06)">
        <v-list-item
          prepend-icon="mdi-cog"
          title="Configurações"
          to="/settings"
          rounded="xl"
          class="mx-2"
        />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'

const menuItems = ref([
  { title: 'Dashboard', icon: 'mdi-view-dashboard', path: '/' },
  { title: 'Funil de Vendas', icon: 'mdi-filter-variant', path: '/crm' },
  { title: 'Tarefas', icon: 'mdi-checkbox-marked-circle-outline', path: '/tasks', badge: '3' },
  { title: 'Leads', icon: 'mdi-account-group', path: '/leads' },
  { title: 'Chat', icon: 'mdi-message-text', path: '/chat', badge: '12' },
  { title: 'Respostas Rápidas', icon: 'mdi-message-reply-text', path: '/quick-replies' },
  { title: 'Automações', icon: 'mdi-robot', path: '/automations' },
  { title: 'Campanhas', icon: 'mdi-bullhorn', path: '/campaigns' },
  { title: 'Analytics', icon: 'mdi-chart-box', path: '/analytics' },
  { title: 'Documentação', icon: 'mdi-book-open-variant', path: '/docs' },
])
</script>

<style scoped>
.drawer {
  background: rgba(15, 15, 26, 0.95) !important;
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
