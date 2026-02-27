#!/usr/bin/env ts-node
import { PrismaClient, LegalDocType } from '@prisma/client';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  COOKIE_POLICY,
  DATA_PROCESSING_AGREEMENT,
} from '../apps/api/src/modules/compliance/templates/legal-docs';

const prisma = new PrismaClient();

/**
 * Seed Legal Documents Script
 * 
 * Populates the database with legal document templates:
 * - Terms of Service
 * - Privacy Policy
 * - Cookie Policy
 * - Data Processing Agreement (DPA)
 * 
 * Usage:
 *   npx ts-node scripts/seed-legal-docs.ts
 * 
 * Features:
 * - Upserts documents (safe to run multiple times)
 * - Sets all documents as active
 * - Uses current date as effective date
 * - Version 1.0.0 for initial documents
 */

async function seedLegalDocs() {
  console.log('\n📄 Seeding legal documents...\n');

  const docs = [
    {
      type: LegalDocType.TERMS_OF_SERVICE,
      version: '1.0.0',
      title: 'Terms of Service',
      content: TERMS_OF_SERVICE,
      summary: 'These terms govern your use of CAFEelevate restaurant management platform.',
      effectiveDate: new Date(),
      isActive: true,
    },
    {
      type: LegalDocType.PRIVACY_POLICY,
      version: '1.0.0',
      title: 'Privacy Policy',
      content: PRIVACY_POLICY,
      summary: 'How we collect, use, and protect your personal data in compliance with GDPR.',
      effectiveDate: new Date(),
      isActive: true,
    },
    {
      type: LegalDocType.COOKIE_POLICY,
      version: '1.0.0',
      title: 'Cookie Policy',
      content: COOKIE_POLICY,
      summary: 'Information about cookies and similar technologies we use on our platform.',
      effectiveDate: new Date(),
      isActive: true,
    },
    {
      type: LegalDocType.DATA_PROCESSING_AGREEMENT,
      version: '1.0.0',
      title: 'Data Processing Agreement',
      content: DATA_PROCESSING_AGREEMENT,
      summary: 'GDPR-compliant agreement defining how we process your customer data.',
      effectiveDate: new Date(),
      isActive: true,
    },
  ];

  try {
    let created = 0;
    let updated = 0;

    for (const doc of docs) {
      const existing = await prisma.legalDocument.findUnique({
        where: {
          type_version: {
            type: doc.type,
            version: doc.version,
          },
        },
      });

      const result = await prisma.legalDocument.upsert({
        where: {
          type_version: {
            type: doc.type,
            version: doc.version,
          },
        },
        create: doc,
        update: {
          title: doc.title,
          content: doc.content,
          summary: doc.summary,
          isActive: doc.isActive,
        },
      });

      if (existing) {
        console.log(`✓ Updated: ${doc.type} v${doc.version}`);
        updated++;
      } else {
        console.log(`✓ Created: ${doc.type} v${doc.version}`);
        created++;
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ Legal documents seeded successfully!');
    console.log('═══════════════════════════════════════════');
    console.log(`📝 Created: ${created} document(s)`);
    console.log(`🔄 Updated: ${updated} document(s)`);
    console.log(`📊 Total:   ${docs.length} document(s)`);
    console.log('═══════════════════════════════════════════\n');

    console.log('📋 Available Documents:');
    console.log('   • Terms of Service (TERMS_OF_SERVICE)');
    console.log('   • Privacy Policy (PRIVACY_POLICY)');
    console.log('   • Cookie Policy (COOKIE_POLICY)');
    console.log('   • Data Processing Agreement (DATA_PROCESSING_AGREEMENT)\n');

    console.log('🔗 API Endpoints:');
    console.log('   GET /api/legal/documents/TERMS_OF_SERVICE');
    console.log('   GET /api/legal/documents/PRIVACY_POLICY');
    console.log('   GET /api/legal/documents/COOKIE_POLICY');
    console.log('   GET /api/legal/documents/DATA_PROCESSING_AGREEMENT\n');

    // Verify all documents are active
    const activeCount = await prisma.legalDocument.count({
      where: { isActive: true },
    });

    console.log(`✓ ${activeCount} active legal document(s) in database\n`);

  } catch (error: any) {
    console.error('\n❌ Failed to seed legal documents:', error);
    
    if (error.code === 'P2002') {
      console.error('\n⚠️  Unique constraint violation - documents may already exist');
    } else if (error.code === 'P2025') {
      console.error('\n⚠️  Record not found - check your database schema');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedLegalDocs().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
