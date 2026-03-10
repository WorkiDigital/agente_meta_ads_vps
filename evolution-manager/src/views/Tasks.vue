<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text mb-2">Tarefas</h1>
        <p class="text-caption" style="color: rgba(255,255,255,0.6)">Gerencie suas tarefas e atividades</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showTaskModal = true">
        Nova Tarefa
      </v-btn>
    </div>

    <!-- Filters -->
    <v-chip-group v-model="filter" class="mb-6">
      <v-chip value="all" variant="outlined">Todas ({{ allTasks.length }})</v-chip>
      <v-chip value="pending" variant="outlined">Pendentes ({{ pendingTasks.length }})</v-chip>
      <v-chip value="completed" variant="outlined">Concluídas ({{ completedTasks.length }})</v-chip>
    </v-chip-group>

    <!-- Tasks List -->
    <v-row>
      <v-col v-for="task in filteredTasks" :key="task.id" cols="12">
        <v-card class="glass-card" :class="{ 'opacity-60': task.completed }">
          <v-card-text class="d-flex align-center">
            <v-checkbox
              :model-value="task.completed"
              @change="toggleTask(task.id)"
              hide-details
              color="primary"
            />
            <div class="flex-grow-1 ml-3">
              <div class="text-body-1 font-weight-medium" :class="{ 'text-decoration-line-through': task.completed }">
                {{ task.title }}
              </div>
              <div class="text-caption mt-1" style="color: rgba(255,255,255,0.6)">
                {{ task.description }}
              </div>
              <div class="mt-2">
                <v-chip size="small" :color="getPriorityColor(task.priority)">{{ task.priority }}</v-chip>
                <v-chip size="small" class="ml-2" variant="outlined">{{ task.dueDate }}</v-chip>
              </div>
            </div>
            <v-btn icon variant="text" size="small" @click="deleteTask(task.id)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="filteredTasks.length === 0" class="text-center py-12">
      <v-icon size="64" color="grey">mdi-checkbox-marked-circle-outline</v-icon>
      <p class="text-h6 mt-4">Nenhuma tarefa</p>
    </div>

    <!-- Task Modal -->
    <v-dialog v-model="showTaskModal" max-width="500">
      <v-card class="glass-card">
        <v-card-title>Nova Tarefa</v-card-title>
        <v-card-text>
          <v-text-field v-model="newTask.title" label="Título" variant="outlined" class="mb-2" />
          <v-textarea v-model="newTask.description" label="Descrição" variant="outlined" rows="3" class="mb-2" />
          <v-select
            v-model="newTask.priority"
            label="Prioridade"
            :items="['baixa', 'média', 'alta']"
            variant="outlined"
            class="mb-2"
          />
          <v-text-field v-model="newTask.dueDate" label="Data de Vencimento" type="date" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showTaskModal = false">Cancelar</v-btn>
          <v-btn color="primary" @click="addTask">Criar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const filter = ref('all')
const showTaskModal = ref(false)
const tasks = ref([
  { id: 1, title: 'Responder leads do WhatsApp', description: 'Verificar novos leads e responder', priority: 'alta', dueDate: '2026-02-03', completed: false },
  { id: 2, title: 'Configurar automação', description: 'Criar mensagens automáticas', priority: 'média', dueDate: '2026-02-05', completed: false },
  { id: 3, title: 'Enviar proposta para João', description: 'Proposta comercial plano premium', priority: 'alta', dueDate: '2026-02-02', completed: true },
])

const newTask = ref({ title: '', description: '', priority: 'média', dueDate: '' })

const allTasks = computed(() => tasks.value)
const pendingTasks = computed(() => tasks.value.filter(t => !t.completed))
const completedTasks = computed(() => tasks.value.filter(t => t.completed))

const filteredTasks = computed(() => {
  if (filter.value === 'pending') return pendingTasks.value
  if (filter.value === 'completed') return completedTasks.value
  return allTasks.value
})

const getPriorityColor = (priority) => {
  const colors = { baixa: 'info', média: 'warning', alta: 'error' }
  return colors[priority] || 'grey'
}

const toggleTask = (id) => {
  const task = tasks.value.find(t => t.id === id)
  if (task) task.completed = !task.completed
}

const addTask = () => {
  tasks.value.unshift({ id: Date.now(), ...newTask.value, completed: false })
  newTask.value = { title: '', description: '', priority: 'média', dueDate: '' }
  showTaskModal.value = false
}

const deleteTask = (id) => {
  if (confirm('Deseja excluir esta tarefa?')) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) tasks.value.splice(index, 1)
  }
}
</script>
