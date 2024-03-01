import type { Table } from './table';

const JOIN_PART = /^\s*(\w+)\s*\[\s*(\w+)\s*\]\s*$/

export function stringToJoin (
  s: string,
  table?: Table,
  tableMap?: Record<string, Table>
): [string, string][] {
  const parts = s.split('+');
  if (parts.length < 2) throw new Error(`bad join "${s}": not enough joins`);
  const joins: [string, string][] = [];
  for (const p of parts) {
    const [_, tableName, columnName] = p.match(JOIN_PART) ?? [];
    if (!tableName || !columnName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE[COL]"`);

    joins.push([tableName, columnName]);
  }
  if (tableMap) for (const j of joins) validateJoin(j, table!, tableMap);
  return joins;
}


export function validateJoin (
  join: [string, string],
  table: Table,
  tableMap: Record<string, Table>
) {
  const [tableName, columnName] = join;
  const s = `${tableName}[${columnName}]`
  const col = table.schema.columnsByName[columnName];
  if (!col)
    throw new Error(`bad join "${s}": "${table.name}" has no "${columnName}"`);
  const jTable = tableMap[tableName];
  if (!jTable)
    throw new Error(`bad join "${s}": "${tableName}" does not exist`);
  const jCol = jTable.schema.columnsByName[jTable.schema.key];
  if (!jCol)
    throw new Error(`bad join "${s}": "${tableName}" has no key????`);
  if (jCol.type !== col.type)
    //throw new Error()
    console.warn(
      `iffy join "${
        s
      }": "${
        columnName
      }" (${
        col.label
      }) is a different type than ${
        tableName
      }.${
        jCol.name
      } (${
        jCol.label
      })`
    );
}

export function joinToString (joins: [string, string][]) {
  return joins.map(([t, c]) => `${t}[${c}]`).join(' + ')
}

const JOINED_PART = /^(\w+)\.(\w+)$/;

export function stringToJoinedBy (
  s: string,
): [string, string][] {
  const parts = s.split(',');
  if (parts.length < 1) throw new Error(`bad joinedBy doesnt exist?`);
  const joinedBy: [string, string][] = [];
  for (const p of parts) {
    const [_, tableName, columnName] = p.match(JOINED_PART) ?? [];
    if (!tableName || !columnName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE.COL"`);

    joinedBy.push([tableName, columnName]);
  }
  return joinedBy;
}

export function joinedByToString (joins: [string, string][]) {
  return joins.map(([t, c]) => `${t}.${c}`).join(',')
}
