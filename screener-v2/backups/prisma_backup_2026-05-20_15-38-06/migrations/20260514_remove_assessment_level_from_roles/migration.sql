-- Remove assessment level from roles - assessment level should only exist at addon configuration level
ALTER TABLE "RoleCatalog" DROP COLUMN "coreBasisRoleId";
