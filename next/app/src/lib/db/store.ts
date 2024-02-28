import { page } from '$app/stores';
import { useDB } from '.';
import { browser } from '$app/environment';
import { asyncable } from '$lib/async-store';

const SLUG_TO_TABLE: Record<string, string> = {
  units: 'Unit',
}

export const dbStore = asyncable(
  async (...[page]: any[]) => {
    if (!browser) return {}; // idk
    const db = await useDB();
    const tableName = SLUG_TO_TABLE[page.params.table];
    if (!tableName) throw new Error('table name 404???');
    const table = db.tables[tableName];
    if (!table) throw new Error('table 404????????');
    // TODO - user can set hteir own columns
    const columns: any[] = table.columns.filter(c => table.defaults.has(c.key))
    console.log('heloo', columns, table)
    return { columns, table };
  },
  () => {},
  [page as any]
)
