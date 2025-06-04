// Type declarations for NextAuth.js
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id. */
      id: string;
      name: string;
      email: string;
      role?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's id. */
    id: string;
    name: string;
    email: string;
    role?: string;
  }
}
