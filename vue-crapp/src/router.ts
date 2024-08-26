import { createRouter, createWebHistory } from 'vue-router';
import FullTable from './FullTable.vue';
import LandingPage from './LandingPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      component: LandingPage,
      name: 'home',
      path: '/',
    },
    {
      component: FullTable,
      name: 'listUnits',
      path: '/units',
      props () {
        return { tableName: 'Unit' }
      },
    }
  ]
})
