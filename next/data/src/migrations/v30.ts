import type { Migration } from 'dom6inspector-next-lib'
import { MIGRATION } from 'dom6inspector-next-lib'

export default [
  {
    type: MIGRATION.CREATE_STORE,
    name: 'Unit',
    primaryKey: 'id',
    indices: [
      { name: 'name', keyPath:'name', options: { unique: false } },
    ]
  },
] as Migration[];
