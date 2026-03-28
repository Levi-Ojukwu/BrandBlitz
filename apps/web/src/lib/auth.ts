import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // After Google OAuth, register user in our API and get a JWT
      try {
        const response = await fetch(
          `${process.env.NEXTAUTH_API_URL ?? process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              googleId: profile?.sub ?? account?.providerAccountId,
              email: user.email,
              name: user.name,
              avatarUrl: user.image,
            }),
          }
        );

        if (!response.ok) return false;

        const data = (await response.json()) as { token: string };
        (user as any).apiToken = data.token;
        return true;
      } catch {
        return false;
      }
    },

    async jwt({ token, user }) {
      if ((user as any)?.apiToken) {
        token.apiToken = (user as any).apiToken;
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).apiToken = token.apiToken;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
