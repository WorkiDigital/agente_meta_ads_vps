<template>
  <div>
    <v-row>
      <!-- Charts -->
      <v-col cols="12" md="6">
        <div class="glass-card pa-6">
          <h3 class="text-h6 mb-4">Leads por Mês</h3>
          <div class="chart-placeholder">
            <v-icon size="80" color="primary">mdi-chart-line</v-icon>
            <p class="text-caption mt-2">Gráfico de leads por mês</p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <div class="glass-card pa-6">
          <h3 class="text-h6 mb-4">Funil de Vendas</h3>
          <div class="chart-placeholder">
            <v-icon size="80" color="success">mdi-chart-areaspline</v-icon>
            <p class="text-caption mt-2">Funil de conversão</p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <div class="glass-card pa-6">
          <h3 class="text-h6 mb-4">Leads por Origem</h3>
          <div class="chart-placeholder">
            <v-icon size="80" color="info">mdi-chart-donut</v-icon>
            <p class="text-caption mt-2">Distribuição por origem</p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <div class="glass-card pa-6">
          <h3 class="text-h6 mb-4">Performance Mensal</h3>
          <div class="chart-placeholder">
            <v-icon size="80" color="warning">mdi-chart-bar</v-icon>
            <p class="text-caption mt-2">Faturamento mensal</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- KPIs -->
    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <div class="glass-card pa-4">
          <div class="text-center">
            <v-icon size="48" color="success">mdi-chart-line-variant</v-icon>
            <h4 class="text-h4 mt-2">32%</h4>
            <p class="text-caption">Taxa de Conversão</p>
          </div>
        </div>
      </v-col>
      <v-col cols="12" md="4">
        <div class="glass-card pa-4">
          <div class="text-center">
            <v-icon size="48" color="info">mdi-currency-usd</v-icon>
            <h4 class="text-h4 mt-2">R$ 2.5k</h4>
            <p class="text-caption">Valor Médio</p>
          </div>
        </div>
      </v-col>
      <v-col cols="12" md="4">
        <div class="glass-card pa-4">
          <div class="text-center">
            <v-icon size="48" color="warning">mdi-clock-outline</v-icon>
            <h4 class="text-h4 mt-2">12 dias</h4>
            <p class="text-caption">Tempo Médio Fechamento</p>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
</script>

<style scoped>
.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  min-height: 250px;
}
</style>
