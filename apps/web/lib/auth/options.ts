import { createTokens, refreshToken } from "@actions/session";
import { IUser } from "@repo/interfaces/userInterface";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createUser, fetchUser } from "./signIn";
import { dummyUser } from "@lib/dummyData";
import { log } from "console";

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
        id: { label: "id", type: "text" },
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
              if (!user) throw new Error("UNREGISTERED_USER");
              console.log("sigining in existing user");
              return user;
            }

            case "signup": {
              const req = {
                id: credentials.id,
                username: credentials.username,
                phoneNumber: credentials.phoneNumber,
                profilePicture: credentials.profilePicture,
              };

              const newUser = await createUser(req)!;
              if (!newUser) throw new Error("USER_CREATION_FAILED");
              if (newUser.error) {
                if (newUser.error.code === 11000) throw new Error("Username already exists");
                throw new Error(newUser.error.message);
              }
              return newUser;
            }
          }

          return null;
        } catch (error: any) {
          console.log("authorize error--------->", error.message);
          throw new Error(error.message);
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
      
      if (trigger === "update" && session?.user) {
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
