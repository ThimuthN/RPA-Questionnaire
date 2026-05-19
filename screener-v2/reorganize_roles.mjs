import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

console.log("🔄 Reorganizing roles into departments...\n");

// 1. Create System department if it doesn't exist
let systemDept = await prisma.department.findUnique({
  where: { slug: "system" }
});

if (!systemDept) {
  systemDept = await prisma.department.create({
    data: {
      name: "System",
      slug: "system",
      isActive: true,
      sortOrder: 0
    }
  });
  console.log("✅ Created System department");
} else {
  console.log("✅ System department already exists");
}

// 2. Get all departments
const depts = await prisma.department.findMany({
  select: { id: true, name: true, slug: true }
});

const deptMap = {};
depts.forEach(d => {
  deptMap[d.slug] = d.id;
});

// 3. Get all roles without departments
const unassignedRoles = await prisma.roleCatalog.findMany({
  where: { departmentId: null },
  select: { id: true, label: true }
});

console.log(`\nFound ${unassignedRoles.length} roles without departments:\n`);

// 4. Assign roles based on naming patterns
let assignments = {
  systemDept: [],
  engineering: [],
  rpa: [],
  deleted: []
};

for (const role of unassignedRoles) {
  const label = role.label.toLowerCase();
  
  // System roles
  if (label.includes("system") || label.includes("admin")) {
    assignments.systemDept.push(role.id);
    console.log(`  → ${role.label} → System (admin)`);
  }
  // Engineering roles
  else if (label.includes("engineer") || label.includes("lead")) {
    assignments.engineering.push(role.id);
    console.log(`  → ${role.label} → Engineering`);
  }
  // RPA/Automation roles
  else if (label.includes("rpa") || label.includes("uipath")) {
    assignments.rpa.push(role.id);
    console.log(`  → ${role.label} → RPA`);
  }
  // Delete test roles
  else if (label.includes("test")) {
    assignments.deleted.push(role.id);
    console.log(`  ✗ ${role.label} (will delete)`);
  }
  else {
    // Default to system
    assignments.systemDept.push(role.id);
    console.log(`  → ${role.label} → System (default)`);
  }
}

// 5. Apply assignments
if (assignments.systemDept.length > 0) {
  await prisma.roleCatalog.updateMany({
    where: { id: { in: assignments.systemDept } },
    data: { departmentId: systemDept.id }
  });
  console.log(`\n✅ Assigned ${assignments.systemDept.length} roles to System department`);
}

if (assignments.engineering.length > 0) {
  const engId = deptMap["engineering-ind"] || deptMap["engineering-sl"];
  if (engId) {
    await prisma.roleCatalog.updateMany({
      where: { id: { in: assignments.engineering } },
      data: { departmentId: engId }
    });
    console.log(`✅ Assigned ${assignments.engineering.length} roles to Engineering`);
  }
}

if (assignments.rpa.length > 0) {
  const rpaId = deptMap["rpa-ind"] || deptMap["rpa-sl"];
  if (rpaId) {
    await prisma.roleCatalog.updateMany({
      where: { id: { in: assignments.rpa } },
      data: { departmentId: rpaId }
    });
    console.log(`✅ Assigned ${assignments.rpa.length} roles to RPA`);
  }
}

if (assignments.deleted.length > 0) {
  await prisma.roleCatalog.deleteMany({
    where: { id: { in: assignments.deleted } }
  });
  console.log(`✅ Deleted ${assignments.deleted.length} test roles`);
}

// 6. Verify all roles now have departments
const rolesWithoutDept = await prisma.roleCatalog.findMany({
  where: { departmentId: null },
  select: { id: true, label: true }
});

if (rolesWithoutDept.length === 0) {
  console.log("\n✅ All roles now have departments assigned!");
} else {
  console.log(`\n⚠️  ${rolesWithoutDept.length} roles still without departments:`);
  rolesWithoutDept.forEach(r => console.log(`    - ${r.label}`));
}

await prisma.$disconnect();
