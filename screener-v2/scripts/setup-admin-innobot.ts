/**
 * Setup Innobot admin user with all permissions
 *
 * Run this from your machine where the database is accessible:
 * BOOTSTRAP_ADMIN_EMAIL="tnayanapriya@innobothealth.com" \
 * BOOTSTRAP_ADMIN_PASSWORD="Innobot@2024" \
 * npx tsx scripts/setup-admin-innobot.ts
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    const email = "tnayanapriya@innobothealth.com";
    const password = "Innobot@2024";
    const name = "Tnayana Priya";

    console.log(`🔐 Setting up Innobot admin user: ${email}`);

    // Get system_admin role
    const systemAdminRole = await prisma.roleCatalog.findUnique({
      where: { slug: "system_admin" },
      include: { permissions: true },
    });

    if (!systemAdminRole) {
      console.error(
        "❌ system_admin role not found. Run migrations first: npm run prisma:migrate:deploy"
      );
      process.exit(1);
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    const hashedPassword = await hashPassword(password);

    let user;
    if (existing) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash: hashedPassword,
          roleId: systemAdminRole.id,
          isActive: true,
          name,
        },
      });
      console.log(`✅ Updated existing user`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          roleId: systemAdminRole.id,
          isActive: true,
        },
      });
      console.log(`✅ Created new admin user`);
    }

    // Get full user with permissions
    const userWithPermissions = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            permissions: { select: { permission: true, scope: true } },
          },
        },
      },
    });

    console.log(`\n📋 Innobot Admin User Created:`);
    console.log(`   Email: ${userWithPermissions?.email}`);
    console.log(`   Name: ${userWithPermissions?.name}`);
    console.log(`   Password: Innobot@2024`);
    console.log(`   Role: ${userWithPermissions?.role?.label}`);

    console.log(`\n🔑 Permissions (${userWithPermissions?.role?.permissions.length}):`);
    userWithPermissions?.role?.permissions.forEach((p) => {
      console.log(`   ✅ ${p.permission} (${p.scope})`);
    });

    console.log(`\n✨ Ready to login at: https://screener-v2-staging.vercel.app`);
  } catch (err) {
    console.error("❌ Setup failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
