<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ $t('newInstance') }}</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="formData.instanceName"
            label="Instance Name"
            prepend-inner-icon="mdi-server"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-3"
          />

          <v-text-field
            v-model="formData.qrcode"
            label="QR Code"
            prepend-inner-icon="mdi-qrcode"
            variant="outlined"
            :rules="[rules.required]"
            type="checkbox"
            class="mb-3"
            hide-details
          >
            <template v-slot:prepend>
              <v-checkbox
                v-model="formData.qrcode"
                hide-details
              />
            </template>
            <template v-slot:label>
              Generate QR Code
            </template>
          </v-text-field>

          <v-text-field
            v-model="formData.number"
            label="Owner Number (Optional)"
            prepend-inner-icon="mdi-phone"
            variant="outlined"
            class="mb-3"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          {{ $t('actions.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="createInstance"
          :loading="loading"
          :disabled="!valid"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/store'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'created'])

const appStore = useAppStore()

const form = ref(null)
const valid = ref(false)
const loading = ref(false)

const formData = ref({
  instanceName: '',
  qrcode: true,
  number: '',
})

const rules = {
  required: value => !!value || 'Required field',
}

const close = () => {
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  formData.value = {
    instanceName: '',
    qrcode: true,
    number: '',
  }
}

const createInstance = async () => {
  if (!valid.value) return

  loading.value = true
  try {
    await appStore.createInstance(formData.value)
    emit('created')
    close()
  } catch (error) {
    console.error('Create error:', error)
  } finally {
    loading.value = false
  }
}
</script>
