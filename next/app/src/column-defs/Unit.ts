import { FTColumn } from '../column';

export const columns: Record<string, FTColumn> = Object.fromEntries([
  {
    key: 'id',
    labelText: 'ID',
  },
  {
    key: 'name',
    labelText: 'Name',
  },
  {
    key: 'att',
    labelText: 'Attack',
  },
  {
    key: 'def',
    labelText: 'Defense',
  },
  {
    key: 'basecost',
    labelText: 'Base Gold Cost',
  }
].map(c => [c.key, c]))

export const defaults = new Set<string>([
  'id', 'name', 'basecost',
])
