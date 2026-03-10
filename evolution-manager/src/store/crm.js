import { defineStore } from 'pinia'

export const useCrmStore = defineStore('crm', {
    state: () => ({
        leads: [],
        columns: [
            { id: 'new', name: 'Novo', color: '#4facfe' },
            { id: 'qualifying', name: 'Qualificando', color: '#fbbf24' },
            { id: 'proposal', name: 'Proposta', color: '#a78bfa' },
            { id: 'negotiation', name: 'Negociação', color: '#fb923c' },
            { id: 'won', name: 'Fechado', color: '#25D366' },
        ],
    }),

    getters: {
        getAllLeads: (state) => state.leads,

        getLeadsByStage: (state) => (stage) => {
            return state.leads.filter(lead => lead.stage === stage)
        },

        totalLeads: (state) => state.leads.length,

        totalValue: (state) => {
            return state.leads.reduce((sum, lead) => sum + (lead.value || 0), 0)
        },

        hotLeads: (state) => {
            return state.leads.filter(lead => lead.score >= 80)
        },
    },

    actions: {
        addLead(leadData) {
            const lead = {
                id: Date.now(),
                ...leadData,
                createdAt: new Date().toISOString(),
                stage: leadData.stage || 'new',
            }
            this.leads.push(lead)
            this.saveLeads()
        },

        updateLead(leadId, updates) {
            const index = this.leads.findIndex(l => l.id === leadId)
            if (index !== -1) {
                this.leads[index] = { ...this.leads[index], ...updates }
                this.saveLeads()
            }
        },

        moveLead(leadId, newStage) {
            const lead = this.leads.find(l => l.id === leadId)
            if (lead) {
                lead.stage = newStage
                this.saveLeads()
            }
        },

        deleteLead(leadId) {
            const index = this.leads.findIndex(l => l.id === leadId)
            if (index !== -1) {
                this.leads.splice(index, 1)
                this.saveLeads()
            }
        },

        saveLeads() {
            localStorage.setItem('crm_leads', JSON.stringify(this.leads))
        },

        loadLeads() {
            const saved = localStorage.getItem('crm_leads')
            if (saved) {
                this.leads = JSON.parse(saved)
            }
        },
    },
})
