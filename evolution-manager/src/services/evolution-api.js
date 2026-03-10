import http from './http-common'

export default {
    // Test connection
    async testConnection() {
        try {
            const response = await http.get('/instance/fetchInstances')
            return { success: true, data: response.data }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    // Get all instances
    async fetchInstances() {
        const response = await http.get('/instance/fetchInstances')
        return response.data
    },

    // Create instance
    async createInstance(data) {
        const response = await http.post('/instance/create', {
            instanceName: data.name,
            number: data.owner,
            qrcode: true,
        })
        return response.data
    },

    // Get instance details
    async getInstanceDetails(instanceName) {
        const response = await http.get(`/instance/connectionState/${instanceName}`)
        return response.data
    },

    // Delete instance
    async deleteInstance(instanceName) {
        const response = await http.delete(`/instance/delete/${instanceName}`)
        return response.data
    },

    // Logout instance
    async logoutInstance(instanceName) {
        const response = await http.delete(`/instance/logout/${instanceName}`)
        return response.data
    },

    // Get QR Code
    async getQRCode(instanceName) {
        const response = await http.get(`/instance/qrcode/${instanceName}`)
        return response.data
    },

    // Send message
    async sendMessage(instanceName, data) {
        const response = await http.post(`/message/sendText/${instanceName}`, data)
        return response.data
    },

    // Send media
    async sendMedia(instanceName, data) {
        const response = await http.post(`/message/sendMedia/${instanceName}`, data)
        return response.data
    },

    // Get webhooks
    async getWebhooks(instanceName) {
        const response = await http.get(`/webhook/find/${instanceName}`)
        return response.data
    },

    // Set webhook
    async setWebhook(instanceName, data) {
        const response = await http.post(`/webhook/set/${instanceName}`, data)
        return response.data
    },
}
