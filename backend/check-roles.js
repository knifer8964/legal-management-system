// Check admin role permissions in DB
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({ include: { _count: { select: { users: true } } } });
  for (const r of roles) {
    console.log(`Role #${r.id} "${r.roleName}" — users: ${r._count.users}`);
    console.log('  permissions:', JSON.stringify(r.permissions));
  }
  // Also check admin user
  const admin = await prisma.user.findUnique({ where: { username: 'admin' }, include: { role: true } });
  console.log('\nAdmin user:', admin.username, 'roleId:', admin.roleId, 'roleName:', admin.role.roleName);
  console.log('Role permissions:', JSON.stringify(admin.role.permissions));
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
