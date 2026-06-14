/**
 * Bootstrap access roles and create initial admin user
 *
 * Idempotent: Safe to run multiple times
 * Requirements:
 *   - BOOTSTRAP_ADMIN_EMAIL (required)
 *   - BOOTSTRAP_ADMIN_PASSWORD (required, 12+ chars)
 *   - BOOTSTRAP_ADMIN_NAME (optional)
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";

const prisma = new PrismaClient();

async function bootstrap() {
  try {
    // Validate environment
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const name = process.env.BOOTSTRAP_ADMIN_NAME || "Admin";

    if (!email) {
      console.error("❌ BOOTSTRAP_ADMIN_EMAIL not set");
      process.exit(1);
    }

    if (!password || password.length < 12) {
      console.error("❌ BOOTSTRAP_ADMIN_PASSWORD must be 12+ characters");
      process.exit(1);
    }

    // Get or create system_admin role
    const systemAdminRole = await prisma.roleCatalog.findUnique({
      where: { slug: "system_admin" },
    });

    if (!systemAdminRole) {
      console.error("❌ system_admin role does not exist. Run migrations first.");
      process.exit(1);
    }

    console.log(`📋 Bootstrapping access for: ${email}`);

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Update existing user: assign system_admin role if needed
      if (!existing.roleId) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { roleId: systemAdminRole.id },
        });
        console.log(`✅ Assigned system_admin role to existing user`);
      } else {
        console.log(`✅ User already has admin access`);
      }
      return;
    }

    // Create new admin user
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        roleId: systemAdminRole.id,
        isActive: true,
      },
    });

    console.log(`✅ Created admin user: ${email}`);
    console.log(`✅ Assigned system_admin role`);
    console.log(`\n📝 Admin user details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Permissions: manage_users, manage_candidates, view_candidates, manage_addons, manage_integrations, create_job, edit_job, create_role, edit_role, delete_role, create_invite, view_results, promote_candidate, delete_candidate, hire_candidate`);
  } catch (err) {
    console.error("❌ Bootstrap failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap();
