import type { Table } from './table';

const JOIN_PART = /^\s*(\w+)\s*\[\s*(\w+)\s*\]\s*(?:=\s*(\w+)\s*)?$/

export function stringToJoin (
  s: string,
  table?: Table,
  tableMap?: Record<string, Table>
): [string, string, string?][] {
  const parts = s.split('+');
  if (parts.length < 2) throw new Error(`bad join "${s}": not enough joins`);
  const joins: [string, string, string?][] = [];
  for (const p of parts) {
    const [_, tableName, columnName, propName] = p.match(JOIN_PART) ?? [];
    if (!tableName || !columnName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE[COL]=PROP"`);

    joins.push([tableName, columnName, propName]);
  }
  if (tableMap) for (const j of joins) validateJoin(j, table!, tableMap);
  return joins;
}


export function validateJoin (
  join: [string, string, string?],
  table: Table,
  tableMap: Record<string, Table>
) {
  const [tableName, columnName, propName] = join;
  const s = `${tableName}[${columnName}]${propName ? '=' + propName : ''}`
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

  if (propName && jTable.schema.columnsByName[propName]) {
    throw new Error(`bad join "${s}": "${propName}" is already used!`);
  }
}

export function joinToString (joins: [string, string, string?][]) {
  return joins.map(([t, c, p]) => `${t}[${c}]` + (p ? `=${p}` : '')).join(' + ');
}

const JOINED_PART = /^(\w+)\.(\w+)=(\w+)$/;

export function stringToJoinedBy (
  s: string,
): [string, string, string][] {
  const parts = s.split(',');
  if (parts.length < 1) throw new Error(`bad joinedBy doesnt exist?`);
  const joinedBy: [string, string, string][] = [];
  for (const p of parts) {
    const [_, tableName, columnName, propName] = p.match(JOINED_PART) ?? [];
    if (!tableName || !columnName || !propName)
      throw new Error(`bad join "${s}": "${p}" does not match "TABLE.COL=PROP"`);

    joinedBy.push([tableName, columnName, propName]);
  }
  return joinedBy;
}

export function joinedByToString (joins: [string, string, string][]) {
  return joins.map(([t, c, p]) => `${t}.${c}=${p}`).join(',');
}
