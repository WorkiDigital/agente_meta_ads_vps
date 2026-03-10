import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
    },
    {
        path: '/crm',
        name: 'CRM',
        component: () => import('@/views/CRM.vue'),
    },
    {
        path: '/tasks',
        name: 'Tasks',
        component: () => import('@/views/Tasks.vue'),
    },
    {
        path: '/leads',
        name: 'Leads',
        component: () => import('@/views/Leads.vue'),
    },
    {
        path: '/chat',
        name: 'Chat',
        component: () => import('@/views/Chat.vue'),
    },
    {
        path: '/quick-replies',
        name: 'QuickReplies',
        component: () => import('@/views/QuickReplies.vue'),
    },
    {
        path: '/automations',
        name: 'Automations',
        component: () => import('@/views/Automations.vue'),
    },
    {
        path: '/campaigns',
        name: 'Campaigns',
        component: () => import('@/views/Campaigns.vue'),
    },
    {
        path: '/analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue'),
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
    },
    {
        path: '/docs',
        name: 'Docs',
        component: () => import('@/views/Docs.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
