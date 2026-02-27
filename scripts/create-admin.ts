#!/usr/bin/env ts-node
import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Create Admin User Script
 * 
 * Creates a new admin user with the specified role and credentials.
 * 
 * Usage:
 *   npx ts-node scripts/create-admin.ts
 *   npx ts-node scripts/create-admin.ts admin@example.com MyPassword123 "Admin Name" SUPER_ADMIN
 * 
 * Arguments:
 *   1. email (optional) - Admin email address
 *   2. password (optional) - Admin password (min 8 chars)
 *   3. name (optional) - Display name
 *   4. role (optional) - SUPER_ADMIN | ADMIN | SUPPORT | BILLING | VIEWER
 */

async function createAdmin() {
  const email = process.argv[2] || 'admin@buzcupz.com';
  const password = process.argv[3] || generateRandomPassword();
  const name = process.argv[4] || 'Super Admin';
  const role = (process.argv[5] || 'SUPER_ADMIN') as AdminRole;

  // Validate password strength
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  // Validate role
  const validRoles: AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'BILLING', 'VIEWER'];
  if (!validRoles.includes(role)) {
    console.error(`❌ Error: Invalid role. Must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  console.log('\n🔐 Creating admin user...\n');

  try {
    // Check if admin already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`⚠️  Admin user with email ${email} already exists!`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      await new Promise<void>((resolve) => {
        readline.question('Update password? (y/N): ', async (answer: string) => {
          readline.close();
          
          if (answer.toLowerCase() === 'y') {
            const hashedPassword = await bcrypt.hash(password, 12);
            await prisma.adminUser.update({
              where: { email },
              data: { password: hashedPassword },
            });
            console.log('✅ Password updated successfully!');
          } else {
            console.log('❌ Aborted');
          }
          
          resolve();
        });
      });

      await prisma.$disconnect();
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get default permissions based on role
    const permissions = getDefaultPermissions(role);

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        permissions,
        isActive: true,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log(`📧 Email:        ${admin.email}`);
    console.log(`👤 Name:         ${admin.name}`);
    console.log(`🔑 Role:         ${admin.role}`);
    console.log(`🔓 Password:     ${password}`);
    console.log(`📅 Created:      ${admin.createdAt.toISOString()}`);
    console.log(`🆔 User ID:      ${admin.id}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Store this password securely');
    console.log('   2. Change the password after first login');
    console.log('   3. Never share admin credentials');
    console.log('   4. Enable 2FA if available\n');

    console.log('🔐 Role Permissions:');
    permissions.forEach(permission => {
      console.log(`   ✓ ${permission}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get default permissions for a role
 */
function getDefaultPermissions(role: AdminRole): string[] {
  const permissionSets: Record<AdminRole, string[]> = {
    SUPER_ADMIN: ['*'], // All permissions
    
    ADMIN: [
      'users:read',
      'users:write',
      'restaurants:read',
      'restaurants:write',
      'orders:read',
      'analytics:read',
      'support:read',
      'support:write',
    ],
    
    SUPPORT: [
      'users:read',
      'restaurants:read',
      'support:read',
      'support:write',
      'tickets:read',
      'tickets:write',
    ],
    
    BILLING: [
      'restaurants:read',
      'billing:read',
      'billing:write',
      'subscriptions:read',
      'subscriptions:write',
      'invoices:read',
    ],
    
    VIEWER: [
      'restaurants:read',
      'users:read',
      'orders:read',
      'analytics:read',
    ],
  };

  return permissionSets[role] || [];
}

/**
 * Generate a secure random password
 */
function generateRandomPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly (total 16 chars)
  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Run the script
createAdmin().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
