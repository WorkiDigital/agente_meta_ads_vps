export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0)
}

export function formatDate(date) {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date) {
    if (!date) return ''
    return new Date(date).toLocaleString('pt-BR')
}

export function formatPhone(phone) {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')

    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }

    return phone
}
