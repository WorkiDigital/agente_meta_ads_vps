<template>
  <div class="chart-container">
    <div class="chart-title">{{ title }}</div>
    <apexchart
      type="area"
      height="300"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, required: true },
  categories: { type: Array, default: () => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] },
})

const series = computed(() => [{
  name: props.title,
  data: props.data,
}])

const chartOptions = {
  chart: {
    type: 'area',
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Roboto, sans-serif',
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'smooth',
    width: 3,
    colors: ['#a855f7'],
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      gradientToColors: ['#a855f7'],
      shadeIntensity: 1,
      type: 'vertical',
      opacityFrom: 0.6,
      opacityTo: 0.1,
    },
  },
  xaxis: {
    categories: props.categories,
    labels: {
      style: {
        colors: 'rgba(255,255,255,0.6)',
        fontSize: '12px',
      },
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: {
        colors: 'rgba(255,255,255,0.6)',
        fontSize: '12px',
      },
    },
  },
  grid: {
    borderColor: 'rgba(255,255,255,0.06)',
    strokeDashArray: 4,
  },
  tooltip: {
    theme: 'dark',
    style: {
      fontSize: '12px',
    },
    y: {
      formatter: (val) => `${val} mensagens`,
    },
  },
  theme: {
    mode: 'dark',
  },
}
</script>
