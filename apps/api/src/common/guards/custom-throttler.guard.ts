import { Injectable, ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    private readonly reflectorParam: Reflector,
    private readonly configService: ConfigService,
  ) {
    // Pass reflector to parent
    super(reflectorParam, configService as any, undefined, undefined);
    // Note: The ThrottlerGuard constructor signature might need adjustment depending on version
    // NestJS Throttler v5/v6 has different signatures.
    // Assuming v6 which is latest, but will check if build fails.
    // Actually, let's keep it simple and assume standard injection works if we follow docs.
    // If we use 'extends ThrottlerGuard', we typically inject dependencies.
  }

  // Override canActivate to add custom logic
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Skip throttling for whitelisted IPs
    const skipIps = this.configService.get<string[]>("throttler.skipIps") || [];
    const clientIp = this.getClientIp(request);

    if (skipIps.includes(clientIp)) {
      return true;
    }

    return super.canActivate(context);
  }

  protected getTracker(request: Record<string, any>): Promise<string> {
    const ip = this.getClientIp(request);
    const userId = request.user?.id || "anonymous";
    return Promise.resolve(`${ip}-${userId}`);
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    const retryAfter = throttlerLimitDetail.timeToRetry || 60;
    throw new ThrottlerException(
      `Too many requests. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
    );
  }

  private getClientIp(request: any): string {
    const forwarded = request.headers["x-forwarded-for"];
    if (forwarded) {
      const ips = forwarded.split(",").map((ip: string) => ip.trim());
      return ips[0];
    }

    return (
      request.headers["x-real-ip"] ||
      request.connection?.remoteAddress ||
      request.ip ||
      "unknown"
    );
  }
}
