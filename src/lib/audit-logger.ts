import { prisma } from "@/lib/prisma";

export async function logAuditEvent({
  tenantId,
  userId,
  userName,
  action,
  entity,
  entityId,
  details,
}: {
  tenantId: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details: any;
}) {
  try {
    const detailsString = typeof details === "string" ? details : JSON.stringify(details);

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: userId || null,
        userName: userName || null,
        action,
        entity,
        entityId: entityId || null,
        details: detailsString,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log entry:", error);
  }
}
