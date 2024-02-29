import type { Migration } from 'dom6inspector-next-lib';

import v30 from './v30';

export const migrations: Record<number, Migration[]> = {
  30: v30,
}
