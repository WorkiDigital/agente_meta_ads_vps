import http from '../http-common'

class InstanceController {
    async fetchInstances() {
        const response = await http.get('/instance/fetchInstances')
        return response.data
    }

    async createInstance(data) {
        const response = await http.post('/instance/create', data)
        return response.data
    }

    async deleteInstance(instanceName) {
        const response = await http.delete(`/instance/delete/${instanceName}`)
        return response.data
    }

    async connectInstance(instanceName) {
        const response = await http.get(`/instance/connect/${instanceName}`)
        return response.data
    }

    async logoutInstance(instanceName) {
        const response = await http.delete(`/instance/logout/${instanceName}`)
        return response.data
    }

    async restartInstance(instanceName) {
        const response = await http.put(`/instance/restart/${instanceName}`)
        return response.data
    }

    async setSettings(instanceName, settings) {
        const response = await http.post(`/settings/set/${instanceName}`, settings)
        return response.data
    }

    async sendMessage(instanceName, data) {
        const response = await http.post(`/message/sendText/${instanceName}`, data)
        return response.data
    }
}

export default new InstanceController()
