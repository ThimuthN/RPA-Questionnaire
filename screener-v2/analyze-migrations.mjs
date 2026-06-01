import fs from 'fs';
import path from 'path';

const migrationsDir = 'prisma/migrations';
const migrations = fs.readdirSync(migrationsDir).filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory());

// Parse each migration
const parsed = migrations.map(name => {
  const sqlPath = path.join(migrationsDir, name, 'migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Extract table creates and alters
  const creates = [];
  const alters = [];
  const references = [];
  
  // CREATE TABLE "TableName"
  const createMatches = sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"(\w+)"/gi);
  for (const match of createMatches) creates.push(match[1]);
  
  // ALTER TABLE "TableName"
  const alterMatches = sql.matchAll(/ALTER TABLE\s+"(\w+)"/gi);
  for (const match of alterMatches) alters.push(match[1]);
  
  // REFERENCES "TableName" (foreign keys)
  const refMatches = sql.matchAll(/REFERENCES\s+"(\w+)"/gi);
  for (const match of refMatches) references.push(match[1]);
  
  // INSERT INTO "TableName"
  const insertMatches = sql.matchAll(/INSERT INTO\s+"(\w+)"/gi);
  for (const match of insertMatches) references.push(match[1]);
  
  return {
    name,
    creates: [...new Set(creates)],
    alters: [...new Set(alters)],
    references: [...new Set(references)]
  };
});

// Build dependency map
const tableCreators = {};
parsed.forEach(m => {
  m.creates.forEach(table => {
    tableCreators[table] = m.name;
  });
});

// Find violations: migration that alters/references table before it's created
const violations = [];
parsed.forEach((m, idx) => {
  const allDeps = [...m.alters, ...m.references];
  allDeps.forEach(table => {
    const creator = tableCreators[table];
    if (creator && creator !== m.name) {
      const creatorIdx = parsed.findIndex(x => x.name === creator);
      if (creatorIdx > idx) {
        violations.push({
          problem: `"${m.name}" references/alters "${table}" but creator "${creator}" runs after (idx ${idx} vs ${creatorIdx})`,
          dependent: m.name,
          blocker: creator,
          table
        });
      }
    }
  });
});

if (violations.length === 0) {
  console.log('✅ No migration ordering violations found!');
} else {
  console.log(`❌ Found ${violations.length} ordering violation(s):\n`);
  violations.forEach(v => {
    console.log(`  • ${v.problem}`);
    console.log(`    → Move "${v.dependent}" to run AFTER "${v.blocker}"\n`);
  });
}
