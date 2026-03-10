import vuetify from './vuetify'
import i18n from './i18n'
import router from '../router'
import pinia from '../store'

export function registerPlugins(app) {
    app
        .use(pinia)
        .use(vuetify)
        .use(router)
        .use(i18n)
}
