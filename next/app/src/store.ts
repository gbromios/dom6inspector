import { defineStore } from 'pinia';
import type { DB } from './db/load';
import { useDB } from './db'
import { markRaw } from 'vue';
import { FTColumn } from './column';
import { columnDefs } from './column-defs';

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
        this.loading.state = 0;
        this.loading.message = 'Done!';
        const t0 = performance.now();
        const db = await useDB(version, this.updateLoadingStatus);
        const t1 = performance.now();
        const dt = ((t1 - t0) / 1000).toFixed(3).replace(/\.0+$/, '');
        console.log(`fetched database (${ dt } seconds)`, db);
        this.setDB(db);
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
      markRaw(db.tables);
      for (const k in db.tables) {
        const t = db.tables[k];
        markRaw(t);
        console.log(`table for ${k}:`, t);
        for (const r of t) markRaw(r);
        const { columns, defaults } = columnDefs[k] ?? {};
        if (!columns) {
          // some tables are not directly viewable tho
          console.warn(`no columns defined ${k}`);
          continue;
        }
        // TODO - try loading from localstorage
        this.columns[k] = Array.from(defaults as string[])
          .map((k: string) => markRaw(columns[k]));

        console.log('loaded columns:', this.columns[k]);
      }
      this.db = markRaw(db);
      const t1 = performance.now();
      const dt = ((t1 - t0) / 1000).toFixed(3).replace(/\.0+$/, '');
      console.log(`set database (${ dt } seconds)`, this.columns);
    },
  },

  getters: {
  }
});
