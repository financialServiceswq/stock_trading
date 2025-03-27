import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    accessToken?: string;  // Include accessToken in User
  }

  interface Session extends DefaultSession {
    accessToken?: string;  // Include accessToken in Session
    user: {
      id: string;
      email: string;
      name: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;  // Store accessToken in JWT token
  }
}
