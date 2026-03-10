import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                colors: {
                    primary: '#a855f7',
                    secondary: '#ec4899',
                    success: '#25D366',
                    error: '#ef4444',
                    warning: '#fbbf24',
                    info: '#06b6d4',
                    background: '#0f0f1a',
                    surface: '#1a1a2e',
                },
            },
        },
    },
})
