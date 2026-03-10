import { createClient } from '@supabase/supabase-js'

// Substitua pelas suas credenciais do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
})

// Helper para verificar conexão
export const testSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('crm_leads').select('count')
        if (error) throw error
        return { success: true, message: 'Conectado ao Supabase!' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}
