import { createTokens, refreshToken } from "@actions/session";
import { IUser } from "@repo/interfaces/userInterface";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createUser, fetchUser } from "./signIn";
import { dummyUser } from "@lib/dummyData";

declare module "next-auth" {
  interface Session {
    user: IUser;
    sessionId: string;
    expires: number;
  }

  interface User extends IUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    user: IUser | null;
    access_token: string | null;
    refresh_token: string | null;
    sessionId: string | null;
    expires: number;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Phone number",
      credentials: {
        phoneNumber: { label: "Phonenumber", type: "text" },
        username: { label: "Username", type: "text" },
        profilePicture: { label: "ProfilePicture", type: "text" },
        type: { label: "Credential type", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) throw new Error("CREDENTIALS_NOT_FOUND");

          if (process.env.NEXT_PUBLIC_CLIENT_ONLY && credentials.type === "mock-signin") {
            return dummyUser;
          }

          if (!credentials?.phoneNumber) throw new Error("INVALID_CREDENTIAL");

          switch (credentials.type) {
            case "signin": {
              const user = await fetchUser(credentials.phoneNumber!);
              console.log("sigining in existing user");
              if (!user) throw new Error("UNREGISTERED_USER");
              return user;
            }

            case "signup": {
              const req = {
                username: credentials.username,
                phoneNumber: credentials.phoneNumber,
                profilePicture: credentials.profilePicture,
              };

              const newUser = await createUser(req)!;

              if (!newUser) throw new Error("USER_CREATION_FAILED");

              return newUser;
            }
          }

          return null;
        } catch (error: any) {
          console.log("authorize error--------->", error.message);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, session, trigger }) {
      if (user) {
        const { refresh_token, sessionId } = await createTokens(user);

        token.user = user;
        token.refresh_token = refresh_token;
        token.sessionId = sessionId;
      }

      if (trigger === "update" && session) {
        token.user = session.user;
      }

      return token;
    },
    async session({ session, token }) {
      session.user = token.user!;
      session.sessionId = token.sessionId!;
      session.expires = token.expires;

      return session;
    },
  },
  events: {
    signOut: async ({ token }) => {
      const sessionId = token.sessionId;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/session/delete/${sessionId}`, {
        method: "DELETE",
      });
    },
  },
  pages: {
    signIn: "/register",
  },
};
