import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store GitHub access token in JWT on initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.username = (profile as any)?.login;
      }
      return token;
    },
    async session({ session, token }) {
      // Add access token and username to session
      (session as any).accessToken = token.accessToken;
      (session as any).username = token.username;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
});
