<template>
  <div>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold gradient-text mb-2">Analytics</h1>
      <p class="text-caption" style="color: rgba(255,255,255,0.6)">Métricas e relatórios detalhados</p>
    </div>

    <!-- Time Range Selector -->
    <v-chip-group v-model="timeRange" class="mb-6">
      <v-chip value="7">Últimos 7 dias</v-chip>
      <v-chip value="30">Últimos 30 dias</v-chip>
      <v-chip value="90">Últimos 90 dias</v-chip>
    </v-chip-group>

    <!-- KPIs -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <StatCard title="Total Conversas" icon="mdi-message-text" :value="1247" icon-color="primary" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <StatCard title="Tempo Médio Resposta" icon="mdi-clock-outline" value="3.5" suffix=" min" icon-color="info" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <StatCard title="Satisfação" icon="mdi-heart" :value="94" suffix="%" icon-color="success" />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <StatCard title="ROI Campanhas" icon="mdi-trending-up" value="287" suffix="%" icon-color="warning" />
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row class="mb-6">
      <v-col cols="12" lg="8">
        <ChartLine title="Conversões por Dia" :data="conversionsData" />
      </v-col>
      <v-col cols="12" lg="4">
        <div class="chart-container">
          <div class="chart-title">Top Origens</div>
          <v-list>
            <v-list-item v-for="source in topSources" :key="source.name">
              <template #prepend>
                <v-icon :color="source.color">mdi-source-fork</v-icon>
              </template>
              <v-list-item-title>{{ source.name }}</v-list-item-title>
              <template #append>
                <v-chip size="small">{{ source.count }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-col>
    </v-row>

    <!-- Detailed Stats -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="glass-card">
          <v-card-title>Performance por Campanha</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Campanha</th>
                  <th>Enviadas</th>
                  <th>Abertas</th>
                  <th>Convertidas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="campaign in campaignStats" :key="campaign.name">
                  <td>{{ campaign.name }}</td>
                  <td>{{ campaign.sent }}</td>
                  <td>{{ campaign.opened }}%</td>
                  <td>{{ campaign.converted }}%</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="glass-card">
          <v-card-title>Horários de Pico</v-card-title>
          <v-card-text>
            <div v-for="hour in peakHours" :key="hour.time" class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span>{{ hour.time }}:00</span>
                <span>{{ hour.messages }} mensagens</span>
              </div>
              <v-progress-linear :model-value="(hour.messages / 200) * 100" color="primary" height="8" rounded />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import ChartLine from '@/components/dashboard/ChartLine.vue'

const timeRange = ref('30')
const conversionsData = ref([45, 62, 58, 71, 89, 95, 102, 88, 76, 84, 91, 105, 98, 112])

const topSources = ref([
  { name: 'Instagram', count: 342, color: '#ec4899' },
  { name: 'Facebook', count: 287, color: '#3b82f6' },
  { name: 'Website', count: 195, color: '#a855f7' },
  { name: 'Indicação', count: 148, color: '#25D366' },
])

const campaignStats = ref([
  { name: 'Black Friday', sent: 500, opened: 68, converted: 12 },
  { name: 'Lançamento', sent: 250, opened: 42, converted: 8 },
  { name: 'Follow-up', sent: 180, opened: 55, converted: 15 },
])

const peakHours = ref([
  { time: '09', messages: 145 },
  { time: '11', messages: 167 },
  { time: '14', messages: 198 },
  { time: '16', messages: 182 },
  { time: '19', messages: 134 },
])
</script>
