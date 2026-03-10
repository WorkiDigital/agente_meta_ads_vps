import { createI18n } from 'vue-i18n'
import pt from '../i18n/pt'
import en from '../i18n/en'
import es from '../i18n/es'

const messages = {
    pt,
    en,
    es,
}

const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('language') || 'pt',
    fallbackLocale: 'en',
    messages,
})

export default i18n
