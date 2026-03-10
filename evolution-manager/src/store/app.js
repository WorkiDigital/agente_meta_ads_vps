import { defineStore } from 'pinia'
import evolutionApi from '@/services/evolution-api'

export const useAppStore = defineStore('app', {
    state: () => ({
        connection: {
            url: localStorage.getItem('evo_url') || '',
            apikey: localStorage.getItem('evo_apikey') || '',
        },
        isConnected: false,
        instances: [],
        loading: false,
        error: null,
    }),

    actions: {
        async connect() {
            if (this.connection.url && this.connection.apikey) {
                this.loading = true
                this.error = null

                try {
                    // Test connection
                    const result = await evolutionApi.testConnection()

                    if (result.success) {
                        localStorage.setItem('evo_url', this.connection.url)
                        localStorage.setItem('evo_apikey', this.connection.apikey)
                        this.isConnected = true

                        // Fetch instances
                        await this.fetchInstances()
                        return { success: true }
                    } else {
                        this.error = 'Falha ao conectar: ' + result.error
                        return { success: false, error: result.error }
                    }
                } catch (error) {
                    this.error = error.message
                    return { success: false, error: error.message }
                } finally {
                    this.loading = false
                }
            }
            return { success: false, error: 'URL e API Key são obrigatórios' }
        },

        disconnect() {
            this.isConnected = false
        },

        async fetchInstances() {
            if (!this.isConnected) return

            this.loading = true
            try {
                const instances = await evolutionApi.fetchInstances()
                this.instances = instances.map(inst => ({
                    id: inst.instance.instanceName,
                    name: inst.instance.instanceName,
                    owner: inst.instance.number || 'N/A',
                    status: inst.instance.status || 'pending',
                    createdAt: new Date().toISOString(),
                }))
                this.saveInstances()
            } catch (error) {
                console.error('Error fetching instances:', error)
                this.loadInstances() // Load from localStorage as fallback
            } finally {
                this.loading = false
            }
        },

        async addInstance(instance) {
            this.loading = true
            this.error = null

            try {
                if (this.isConnected) {
                    // Create via API
                    const result = await evolutionApi.createInstance(instance)
                    await this.fetchInstances()
                    return { success: true, data: result }
                } else {
                    // Local only
                    this.instances.push({
                        id: Date.now().toString(),
                        ...instance,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                    })
                    this.saveInstances()
                    return { success: true }
                }
            } catch (error) {
                this.error = error.message
                return { success: false, error: error.message }
            } finally {
                this.loading = false
            }
        },

        async deleteInstance(id) {
            this.loading = true
            this.error = null

            try {
                if (this.isConnected) {
                    // Delete via API
                    await evolutionApi.deleteInstance(id)
                    await this.fetchInstances()
                } else {
                    // Local only
                    const index = this.instances.findIndex(i => i.id === id)
                    if (index !== -1) {
                        this.instances.splice(index, 1)
                        this.saveInstances()
                    }
                }
                return { success: true }
            } catch (error) {
                this.error = error.message
                return { success: false, error: error.message }
            } finally {
                this.loading = false
            }
        },

        saveInstances() {
            localStorage.setItem('instances', JSON.stringify(this.instances))
        },

        loadInstances() {
            const saved = localStorage.getItem('instances')
            if (saved) {
                this.instances = JSON.parse(saved)
            }
        },
    },
})
