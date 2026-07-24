import { prisma } from "@/lib/prisma";

export class AuditService {
  static async log(params: {
    tenantId?: string | null;
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: Record<string, unknown> | string;
    ipAddress?: string;
  }) {
    try {
      const detailsStr = typeof params.details === "object" ? JSON.stringify(params.details) : params.details;
      await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId || null,
          userId: params.userId || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          details: detailsStr || null,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }
}
