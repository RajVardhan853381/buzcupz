import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ConsentType, LegalDocType } from '@prisma/client';

export interface ConsentRecord {
  type: ConsentType;
  granted: boolean;
  version: string;
  timestamp: Date;
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordConsent(params: {
    userId?: string;
    customerId?: string;
    email?: string;
    consents: Array<{ type: ConsentType; granted: boolean }>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const { userId, customerId, email, consents, ipAddress, userAgent } = params;

    // Get current policy versions
    const policies = await this.prisma.legalDocument.findMany({
      where: { isActive: true },
      select: { type: true, version: true },
    });

    const versionMap = new Map(policies.map((p) => [p.type, p.version]));

    for (const consent of consents) {
      const policyType = this.mapConsentToPolicy(consent.type);
      const version = versionMap.get(policyType as LegalDocType) || '1.0.0';

      if (consent.granted) {
        await this.prisma.consent.create({
          data: {
            userId,
            customerId,
            email,
            type: consent.type,
            version,
            granted: true,
            ipAddress,
            userAgent,
          },
        });
      } else {
        // Revoke existing consent
        await this.prisma.consent.updateMany({
          where: {
            OR: [{ userId }, { customerId }, { email }].filter(Boolean),
            type: consent.type,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }
    }

    this.logger.log(`Consent recorded for ${userId || customerId || email}`);
  }

  async getConsents(params: {
    userId?: string;
    customerId?: string;
    email?: string;
  }): Promise<ConsentRecord[]> {
    const consents = await this.prisma.consent.findMany({
      where: {
        OR: [
          { userId: params.userId },
          { customerId: params.customerId },
          { email: params.email },
        ].filter((c) => Object.values(c)[0]),
        revokedAt: null,
      },
      orderBy: { grantedAt: 'desc' },
    });

    return consents.map((c) => ({
      type: c.type,
      granted: c.granted,
      version: c.version,
      timestamp: c.grantedAt,
    }));
  }

  async hasConsent(params: {
    userId?: string;
    customerId?: string;
    email?: string;
    type: ConsentType;
  }): Promise<boolean> {
    const consent = await this.prisma.consent.findFirst({
      where: {
        OR: [
          { userId: params.userId },
          { customerId: params.customerId },
          { email: params.email },
        ].filter((c) => Object.values(c)[0]),
        type: params.type,
        granted: true,
        revokedAt: null,
      },
    });

    return !!consent;
  }

  async revokeConsent(params: {
    userId?: string;
    customerId?: string;
    email?: string;
    type: ConsentType;
  }): Promise<void> {
    await this.prisma.consent.updateMany({
      where: {
        OR: [
          { userId: params.userId },
          { customerId: params.customerId },
          { email: params.email },
        ].filter((c) => Object.values(c)[0]),
        type: params.type,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private mapConsentToPolicy(consentType: ConsentType): string {
    const mapping: Record<ConsentType, string> = {
      TERMS_OF_SERVICE: 'TERMS_OF_SERVICE',
      PRIVACY_POLICY: 'PRIVACY_POLICY',
      MARKETING_EMAIL: 'PRIVACY_POLICY',
      MARKETING_SMS: 'PRIVACY_POLICY',
      COOKIE_ESSENTIAL: 'COOKIE_POLICY',
      COOKIE_ANALYTICS: 'COOKIE_POLICY',
      COOKIE_MARKETING: 'COOKIE_POLICY',
      DATA_PROCESSING: 'DATA_PROCESSING_AGREEMENT',
    };
    return mapping[consentType];
  }
}
