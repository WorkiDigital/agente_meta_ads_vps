<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    @click="rail = false"
    class="drawer"
  >
    <v-list-item
      prepend-icon="mdi-whatsapp"
      title="Evolution Manager"
      nav
    >
      <template v-slot:append>
        <v-btn
          variant="text"
          icon="mdi-chevron-left"
          @click.stop="rail = !rail"
        />
      </template>
    </v-list-item>

    <v-divider />

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.to"
        color="primary"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'

const drawer = ref(true)
const rail = ref(false)

const menuItems = ref([
  {
    title: 'Dashboard',
    icon: 'mdi-view-dashboard',
    to: '/home',
  },
  {
    title: 'CRM',
    icon: 'mdi-account-group',
    to: '/crm',
  },
  {
    title: 'Documentação',
    icon: 'mdi-file-document',
    to: '/docs',
  },
])
</script>

<style scoped>
.drawer {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
