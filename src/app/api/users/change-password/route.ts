import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUserId, currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }

    const isSelf = !targetUserId || targetUserId === session.user.id;

    if (isSelf) {
      // Changing own password: require current password check
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required." }, { status: 400 });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!currentUser || !currentUser.passwordHash) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: newPasswordHash },
      });

      return NextResponse.json({ success: true, message: "Your password has been changed successfully." });
    } else {
      // Owner/Admin changing a staff member's password
      const callerRole = session.user.role;
      if (callerRole !== "OWNER" && callerRole !== "ADMIN" && callerRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Only company owners can change staff passwords." }, { status: 403 });
      }

      const targetUser = await prisma.user.findFirst({
        where: { id: targetUserId, tenantId: session.user.tenantId },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: targetUserId },
        data: { passwordHash: newPasswordHash },
      });

      return NextResponse.json({ success: true, message: `Password for ${targetUser.name} changed successfully.` });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
