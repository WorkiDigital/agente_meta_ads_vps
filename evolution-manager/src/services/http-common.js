import axios from 'axios'

const apiClient = axios.create({
    baseURL: '',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor para adicionar API key
apiClient.interceptors.request.use(
    (config) => {
        const apikey = localStorage.getItem('evo_apikey')
        const url = localStorage.getItem('evo_url')

        if (url) {
            config.baseURL = url
        }

        if (apikey) {
            config.headers['apikey'] = apikey
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor para tratamento global de erros
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized - API Key inválida')
        }
        return Promise.reject(error)
    }
)

export default apiClient
