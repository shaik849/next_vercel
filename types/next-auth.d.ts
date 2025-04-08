import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;         // Required
      name: string;       // Required (matches Prisma)
      email: string;      // Required (matches Prisma)
      image?: string | null; // Optional (from DefaultSession)
      role: string;       // Required (matches Prisma default "USER")
    } & DefaultSession["USER"]; // Extend default properties
  }

  interface User {
    id: string;
    role: string;
  }

  interface JWT {
    id: string;
    role: string;
  }
}