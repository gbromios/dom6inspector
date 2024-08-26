const { readFileSync } = require('fs');

const [fields, ...data] = readFileSync('../gamedata/weapons.csv', { encoding: 'utf8' })
  .split('\n')
  .filter(l => l)
  .map(l => l.split('\t').map(c => c.trim()).filter(c => c));

const iID = fields.indexOf('id');
const iWpn = fields.indexOf('weapon');

if (iID === -1 || iWpn === -1) {
  console.log('missing expected columns id / weapon', { fields });
  process.exit(1);
}

let m = 0;
for (const [i, d] of data.entries()) {
  const id = d[iID];
  const wpn = d[iWpn];
  if (id !== wpn) {
    m++;
    console.log(`line:${i + 1} mismatch: ${weapon} !== ${id}`, { row: d });
  }
}

console.log(`got ${m} weapon/id mismatches`)

