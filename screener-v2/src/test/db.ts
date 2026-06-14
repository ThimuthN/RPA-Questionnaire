import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function parseDatabaseTarget(rawUrl?: string) {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    return {
      baseIdentity: `${url.hostname}${url.pathname}`,
      schema: url.searchParams.get("schema") || "public"
    };
  } catch {
    return null;
  }
}

export function assertIsolatedTestDatabase() {
  const currentTarget = parseDatabaseTarget(process.env.DATABASE_URL?.trim());
  const testTarget = parseDatabaseTarget(process.env.TEST_DATABASE_URL?.trim());

  if (
    !currentTarget ||
    !testTarget ||
    currentTarget.baseIdentity !== testTarget.baseIdentity ||
    currentTarget.schema !== testTarget.schema
  ) {
    throw new Error(
      "DB tests must run only with DATABASE_URL set from TEST_DATABASE_URL. Refusing to touch the current database."
    );
  }

  if (currentTarget.schema === "public") {
    throw new Error("DB tests must never run against the public schema.");
  }

  return currentTarget;
}

export async function truncateTestDatabase() {
  const target = assertIsolatedTestDatabase();

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>(Prisma.sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ${target.schema}
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename ASC
  `);

  if (tables.length === 0) {
    return;
  }

  const tableList = tables
    .map((row) => `${quoteIdentifier(target.schema)}.${quoteIdentifier(row.tablename)}`)
    .join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
}

export async function disconnectTestDatabase() {
  await prisma.$disconnect();
}
