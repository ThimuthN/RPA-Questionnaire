type CleanupClient = {
  rolePermissionTemplate: {
    findMany: (args: {
      where: {
        role: {
          kind: "job_designation";
        };
      };
      select: {
        id: true;
      };
    }) => Promise<Array<{ id: string }>>;
    deleteMany: (args: {
      where: {
        id: {
          in: string[];
        };
      };
    }) => Promise<{ count: number }>;
  };
};

export async function cleanupJobDesignationPermissionTemplates(
  client: CleanupClient,
  input?: { apply?: boolean }
) {
  const matchingRows = await client.rolePermissionTemplate.findMany({
    where: {
      role: {
        kind: "job_designation"
      }
    },
    select: {
      id: true
    }
  });

  const ids = matchingRows.map((row) => row.id);
  if (!input?.apply || ids.length === 0) {
    return {
      apply: Boolean(input?.apply),
      matchingCount: ids.length,
      deletedCount: 0
    };
  }

  const deleted = await client.rolePermissionTemplate.deleteMany({
    where: {
      id: {
        in: ids
      }
    }
  });

  return {
    apply: true,
    matchingCount: ids.length,
    deletedCount: deleted.count
  };
}
