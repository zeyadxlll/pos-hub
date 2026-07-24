import { Role, SubscriptionStatus } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
    subscriptionStatus?: SubscriptionStatus;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      tenantId?: string;
      tenantName?: string;
      tenantSlug?: string;
      subscriptionStatus?: SubscriptionStatus;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
    subscriptionStatus?: SubscriptionStatus;
  }
}
