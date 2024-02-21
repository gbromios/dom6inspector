import { createRouter, createWebHistory } from 'vue-router';
import FullTable from './FullTable.vue'
import { useStore } from './store';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      component: FullTable,
      name: 'listUnits',
      path: '/units',
      props () {
        const store = useStore();
        return {
          name: 'Unit',
          rows: store.db?.tables.Unit,
          columns: store.columns.Unit,
          rowKey: 'id',
        }
      },
    }
  ]
})
