import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Teardown for E2E tests
 * - Cleans up test data
 */
export default async () => {
    console.log('\n🧹 Cleaning up E2E test environment...');

    try {
        // Optional: Clean up test data
        // Comment out if you want to inspect test data after tests
        // await prisma.$executeRaw`TRUNCATE TABLE "User", "Session", "Order", "Reservation" CASCADE`;
        
        console.log('✅ Cleanup complete\n');
    } catch (error) {
        console.error('❌ Failed to cleanup E2E test environment:', error);
    } finally {
        await prisma.$disconnect();
    }
};
