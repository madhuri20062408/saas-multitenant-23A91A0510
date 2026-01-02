// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create plans
  const freePlan = await prisma.plan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      maxUsers: 5,
      maxProjects: 3,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      maxUsers: 50,
      maxProjects: 20,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      maxUsers: 500,
      maxProjects: 100,
    },
  });

  console.log('✅ Plans created');

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'acme' },
    update: {},
    create: {
      name: 'Acme Inc',
      subdomain: 'acme',
      planId: proPlan.id,
    },
  });

  console.log('✅ Tenant created');

  // Create admin user
  const adminHash = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'alice@acme.com'
      }
    },
    update: {},
    create: {
      email: 'alice@acme.com',
      name: 'Alice Admin',
      passwordHash: adminHash,
      role: 'TENANT_ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Admin user created');

  // Create regular user
  const userHash = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: tenant.id,
        email: 'bob@acme.com'
      }
    },
    update: {},
    create: {
      email: 'bob@acme.com',
      name: 'Bob User',
      passwordHash: userHash,
      role: 'USER',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Regular user created');

  // Create super admin (no tenant)
  const superAdminHash = await bcrypt.hash('Admin123!', 10);
  
  await prisma.user.upsert({
    where: { 
      tenantId_email: {
        tenantId: null,
        email: 'superadmin@system.com'
      }
    },
    update: {},
    create: {
      email: 'superadmin@system.com',
      name: 'Super Admin',
      passwordHash: superAdminHash,
      role: 'SUPER_ADMIN',
      tenantId: null,
    },
  });

  console.log('✅ Super admin created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
