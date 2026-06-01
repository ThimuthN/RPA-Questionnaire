import fs from 'fs';
import path from 'path';

const migrationsDir = 'prisma/migrations';
const migrations = fs.readdirSync(migrationsDir)
  .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
  .sort();

// Parse each migration
const parsed = migrations.map(name => {
  const sqlPath = path.join(migrationsDir, name, 'migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  const creates = [];
  const alters = [];
  const references = [];
  
  // CREATE TABLE
  const createMatches = sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"(\w+)"/gi);
  for (const match of createMatches) creates.push(match[1]);
  
  // ALTER TABLE
  const alterMatches = sql.matchAll(/ALTER TABLE\s+"(\w+)"/gi);
  for (const match of alterMatches) alters.push(match[1]);
  
  // REFERENCES, JOIN, UPDATE, INSERT, WITH...JOIN
  const refMatches = sql.matchAll(/(?:REFERENCES|JOIN|UPDATE|INSERT INTO|WITH\s+\w+\s+AS\s*\([^)]*(?:FROM|JOIN))?\s+"(\w+)"/gi);
  for (const match of refMatches) references.push(match[1]);
  
  return { name, creates: [...new Set(creates)], alters: [...new Set(alters)], references: [...new Set(references)] };
});

// Build creator map
const creators = {};
parsed.forEach(m => m.creates.forEach(t => creators[t] = m.name));

// Find all violations
const violations = [];
parsed.forEach((m, idx) => {
  const needs = [...m.alters, ...m.references];
  needs.forEach(table => {
    const creator = creators[table];
    if (creator && creator !== m.name) {
      const creatorIdx = parsed.findIndex(x => x.name === creator);
      if (creatorIdx > idx) {
        violations.push({ dependent: m.name, blocker: creator, table, depIdx: idx, blockIdx: creatorIdx });
      }
    }
  });
});

if (violations.length === 0) {
  console.log('✅ All migrations have correct ordering');
} else {
  // Group by migration
  const byDep = {};
  violations.forEach(v => {
    if (!byDep[v.dependent]) byDep[v.dependent] = [];
    byDep[v.dependent].push(v.blocker);
  });
  
  console.log(`\n❌ Found ${Object.keys(byDep).length} migrations with ordering issues:\n`);
  Object.entries(byDep).forEach(([dep, blockers]) => {
    const maxBlocker = blockers.reduce((a, b) => parsed.findIndex(x => x.name === a) > parsed.findIndex(x => x.name === b) ? a : b);
    console.log(`  Rename "${dep}" → "${maxBlocker.replace(/^\d+/, m => (parseInt(m)+1).toString())}"`);
  });
}
