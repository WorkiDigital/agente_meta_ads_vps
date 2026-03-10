<template>
  <div class="stat-card" @click="$emit('click')">
    <div class="stat-card-icon">
      <v-icon :color="iconColor" size="28">{{ icon }}</v-icon>
    </div>
    <div class="stat-card-content">
      <div class="stat-card-value animate-count">
        {{ formattedValue }}
      </div>
      <div class="stat-card-label">{{ title }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: String, required: true },
  iconColor: { type: String, default: 'primary' },
  suffix: { type: String, default: '' },
  prefix: { type: String, default: '' },
})

defineEmits(['click'])

const formattedValue = computed(() => {
  return `${props.prefix}${props.value}${props.suffix}`
})
</script>
