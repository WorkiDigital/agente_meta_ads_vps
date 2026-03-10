export function mapStatus(status) {
    const statusMap = {
        open: {
            text: 'Conectado',
            color: 'success',
            icon: 'mdi-check-circle',
        },
        close: {
            text: 'Desconectado',
            color: 'error',
            icon: 'mdi-close-circle',
        },
        connecting: {
            text: 'Conectando',
            color: 'warning',
            icon: 'mdi-loading',
        },
    }

    return statusMap[status] || statusMap.close
}
