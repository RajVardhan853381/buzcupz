import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { ConsentService } from "../services/consent.service";
import { GdprService } from "../services/gdpr.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Public } from "../../../common/decorators/public.decorator";
import { LegalDocType, ConsentType } from "@prisma/client";

interface CurrentUser {
  id: string;
  email: string;
}

// Decorator to get current user - replace with your actual implementation
const CurrentUser = () => {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    // Placeholder
  };
};

@ApiTags("Legal & Compliance")
@Controller("legal")
export class LegalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consentService: ConsentService,
    private readonly gdprService: GdprService,
  ) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get("documents/:type")
  @Public()
  @ApiOperation({ summary: "Get legal document by type" })
  async getDocument(@Param("type") type: LegalDocType) {
    const document = await this.prisma.legalDocument.findFirst({
      where: { type, isActive: true },
      orderBy: { effectiveDate: "desc" },
    });

    return document;
  }

  @Get("documents/:type/versions")
  @Public()
  @ApiOperation({ summary: "Get all versions of a legal document" })
  async getDocumentVersions(@Param("type") type: LegalDocType) {
    return this.prisma.legalDocument.findMany({
      where: { type },
      select: {
        version: true,
        effectiveDate: true,
        isActive: true,
      },
      orderBy: { effectiveDate: "desc" },
    });
  }

  // ============ CONSENT MANAGEMENT ============

  @Post("consent")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Record user consent" })
  async recordConsent(
    @CurrentUser() user: CurrentUser,
    @Body() body: { consents: Array<{ type: ConsentType; granted: boolean }> },
  ) {
    await this.consentService.recordConsent({
      userId: user.id,
      consents: body.consents,
    });

    return { success: true };
  }

  @Get("consent")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user consents" })
  async getConsents(@CurrentUser() user: CurrentUser) {
    return this.consentService.getConsents({ userId: user.id });
  }

  @Post("consent/revoke")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Revoke consent" })
  async revokeConsent(
    @CurrentUser() user: CurrentUser,
    @Body() body: { type: ConsentType },
  ) {
    await this.consentService.revokeConsent({
      userId: user.id,
      type: body.type,
    });

    return { success: true };
  }

  // ============ DATA REQUESTS ============

  @Post("data/export")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Request data export" })
  async requestExport(@CurrentUser() user: CurrentUser) {
    return this.gdprService.requestDataExport(user.email, "user");
  }

  @Post("data/delete")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Request data deletion" })
  async requestDeletion(@CurrentUser() user: CurrentUser) {
    return this.gdprService.requestDataDeletion(user.email, "user");
  }

  @Get("data/request/:token")
  @Public()
  @ApiOperation({ summary: "Verify data request" })
  async verifyRequest(@Param("token") token: string) {
    await this.gdprService.verifyDataRequest(token);
    return { success: true, message: "Request verified and processing" };
  }

  // ============ COOKIE CONSENT (for frontend) ============

  @Post("cookies/consent")
  @Public()
  @ApiOperation({ summary: "Record cookie consent" })
  async recordCookieConsent(
    @Body()
    body: {
      email?: string;
      essential: boolean;
      analytics: boolean;
      marketing: boolean;
    },
  ) {
    const consents = [
      { type: ConsentType.COOKIE_ESSENTIAL, granted: body.essential },
      { type: ConsentType.COOKIE_ANALYTICS, granted: body.analytics },
      { type: ConsentType.COOKIE_MARKETING, granted: body.marketing },
    ];

    await this.consentService.recordConsent({
      email: body.email,
      consents,
    });

    return { success: true };
  }
}
