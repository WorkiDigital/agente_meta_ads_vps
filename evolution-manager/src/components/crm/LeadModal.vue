<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="700"
    persistent
  >
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ lead ? 'Editar Lead' : 'Novo Lead' }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="form" v-model="valid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                label="Nome *"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.phone"
                label="Telefone *"
                prepend-inner-icon="mdi-phone"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.email"
                label="Email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                type="email"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.value"
                label="Valor do Negócio"
                prepend-inner-icon="mdi-currency-usd"
                variant="outlined"
                type="number"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.stage"
                :items="stages"
                label="Estágio *"
                prepend-inner-icon="mdi-flag"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.priority"
                :items="priorities"
                label="Prioridade"
                prepend-inner-icon="mdi-alert"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="formData.score"
                label="Score (0-100)"
                prepend-inner-icon="mdi-fire"
                variant="outlined"
                type="number"
                min="0"
                max="100"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.source"
                label="Origem"
                prepend-inner-icon="mdi-source-branch"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Observações"
                prepend-inner-icon="mdi-note-text"
                variant="outlined"
                rows="3"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="save"
          :disabled="!valid"
        >
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  lead: Object,
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref(null)
const valid = ref(false)

const formData = ref({
  name: '',
  phone: '',
  email: '',
  value: 0,
  stage: 'new',
  priority: 'medium',
  score: 50,
  source: '',
  notes: '',
})

const stages = ref([
  { title: 'Novo', value: 'new' },
  { title: 'Qualificando', value: 'qualifying' },
  { title: 'Proposta', value: 'proposal' },
  { title: 'Negociação', value: 'negotiation' },
  { title: 'Fechado', value: 'won' },
])

const priorities = ref([
  { title: 'Alta', value: 'high' },
  { title: 'Média', value: 'medium' },
  { title: 'Baixa', value: 'low' },
])

const rules = {
  required: value => !!value || 'Campo obrigatório',
}

watch(() => props.lead, (newLead) => {
  if (newLead) {
    formData.value = { ...newLead }
  } else {
    resetForm()
  }
}, { immediate: true })

const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    name: '',
    phone: '',
    email: '',
    value: 0,
    stage: 'new',
    priority: 'medium',
    score: 50,
    source: '',
    notes: '',
  }
}

const save = () => {
  if (!valid.value) return
  emit('save', formData.value)
  close()
}
</script>
