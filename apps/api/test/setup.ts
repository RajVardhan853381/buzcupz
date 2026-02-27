import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Setup for E2E tests
 * - Ensures test database is ready
 * - Runs migrations
 * - Seeds basic test data
 */
export default async () => {
    console.log('\n🔧 Setting up E2E test environment...');

    try {
        // Check if DATABASE_URL is set
        if (!process.env.DATABASE_URL) {
            throw new Error(
                'DATABASE_URL environment variable is not set for E2E tests.\n' +
                'Set it to a test database: postgresql://user:pass@localhost:5432/test_db'
            );
        }

        console.log('📦 Running database migrations...');
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env,
        });

        console.log('🌱 Seeding test data...');
        
        // Create test restaurant
        const restaurant = await prisma.restaurant.upsert({
            where: { slug: 'test-restaurant' },
            update: {},
            create: {
                name: 'Test Restaurant',
                slug: 'test-restaurant',
                email: 'test@restaurant.com',
                phone: '+1234567890',                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                postalCode: '12345',                isActive: true,
                taxRate: 10,
                currency: 'USD',
                timezone: 'America/New_York',
            },
        });

        console.log(`✅ Test restaurant created: ${restaurant.id}`);

        // Create test tables
        await prisma.table.createMany({
            data: [
                {
                    name: 'Table 1',
                    number: '1',
                    section: 'Main',
                    maxCapacity: 4,
                    minCapacity: 2,
                    status: 'AVAILABLE',
                    isActive: true,
                    restaurantId: restaurant.id,
                },
                {
                    name: 'Table 2',
                    number: '2',
                    section: 'Main',
                    maxCapacity: 6,
                    minCapacity: 4,
                    status: 'AVAILABLE',
                    isActive: true,
                    restaurantId: restaurant.id,
                },
            ],
            skipDuplicates: true,
        });

        console.log('✅ Test tables created');
        console.log('✨ E2E test environment ready!\n');
    } catch (error) {
        console.error('❌ Failed to setup E2E test environment:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};
