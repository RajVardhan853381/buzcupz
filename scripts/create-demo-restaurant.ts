import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDemo() {
  console.log('🚀 Creating demo restaurant and user...');

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'demo-cafe' },
    update: {},
    create: {
      name: 'Demo Cafe',
      slug: 'demo-cafe',
      email: 'demo@example.com',
      phone: '1234567890',
      address: '123 Demo St',
      city: 'Demo City',
      state: 'Demo State',
      postalCode: '12345',
      subdomain: 'demo',
      taxRate: 0,
      serviceFeeRate: 0,
    },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@buzcupz.com' },
    update: {
        restaurantId: restaurant.id,
    },
    create: {
      email: 'admin@buzcupz.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      restaurantId: restaurant.id,
    },
  });

  console.log('✅ Demo restaurant created:', restaurant.name);
  console.log('✅ Demo user created:', user.email);
  console.log('🔑 Password: password123');
}

createDemo()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
