import type { DB } from './db';

import { defineStore } from 'pinia';
import { useDB } from './db';
import { markRaw } from 'vue';
import { FTColumn } from './column';
import { defs } from './table-defs';

export const useStore = defineStore('dom6-tables', {
  state: () => ({
    db: null as DB | null,
    fatalError: null as string | null,
    loading: {
      state: 1,
      message: 'Initializing App...',
      progress: null,
      max: null,
    },
    // TODO - pull from localstorage?
    columns: {} as Record<string, FTColumn[]>
  }),

  actions: {
    async initDB(version?: number) {
      if (this.loading.state !== 1) throw new Error('too late');
      this.loading.state = 2;
      this.loading.message = 'Loading Database...';
      try {
        this.loading.message = 'Done!';
        const t0 = performance.now();
        const db = await useDB(version, this.updateLoadingStatus);
        const t1 = performance.now();
        const dt = ((t1 - t0) / 1000).toFixed(3).replace(/\.0+$/, '');
        console.log(`fetched database (${ dt } seconds)`, db);
        this.setDB(db);
        this.loading.state = 0;
      } catch (ex) {
        this.loading.state = Infinity;
        const errorText = (ex as any).message ?? String(ex);
        this.fatalError = `Fatal error in initDB: ${errorText}`
      }
    },

    updateLoadingStatus (...args: any[]) {
    },

    setDB (db: DB) {
      const t0 = performance.now();
      // um... idk
      this.db = markRaw(db);
      this.columns = {};
      for (const name in this.db.tables) {
        if (this.columns[name]) continue; // already have some
        // TODO - or load previously saved?
        const { columns, defaults } = this.db.tables[name];
        this.columns[name] = columns.filter(({ key }) => defaults.has(key as string));
      }
      const t1 = performance.now();
      const dt = ((t1 - t0) / 1000).toFixed(3).replace(/\.0+$/, '');
      console.log(`set database (${ dt } seconds)`, this.columns);
    },
  },

  getters: {
  }
});
