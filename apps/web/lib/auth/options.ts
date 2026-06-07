import { createTokens, refreshToken } from "@actions/session";
import { IUser } from "@repo/interfaces/userInterface";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createUser, fetchUser } from "./signIn";
import { AxiosError } from "axios";

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
        otpToken: { label: "OTP Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) throw new Error("CREDENTIALS_NOT_FOUND");

          if (!credentials?.phoneNumber) throw new Error("INVALID_CREDENTIAL");

          switch (credentials.type) {
            case "signin": {
              const user = await fetchUser(credentials.phoneNumber!);
              if (!user) throw new Error("UNREGISTERED_USER");
              return user;
            }

            case "signup": {
              if (!credentials.otpToken) throw new Error("OTP verification required");

              const req = {
                id: credentials.id,
                username: credentials.username,
                phoneNumber: credentials.phoneNumber,
                profilePicture: credentials.profilePicture,
              };

              const newUser = await createUser(req, credentials.otpToken);
              return newUser;
            }
          }

          return null;
        } catch (error: any) {
          // Extract backend error message from Axios response if available
          const message = error?.response?.data?.error?.message ?? error?.message ?? "Authentication failed";
          throw new Error(message);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, session, trigger }) {
      if (session?.user) console.log("session existssssssssssssssssssssssss");
      if (user) {
        token.user = user;
        try {
          const { refresh_token, sessionId } = await createTokens(user);
          token.refresh_token = refresh_token;
          token.sessionId = sessionId;
        } catch (error) {
          console.error("[jwt callback] createTokens failed:", error);
          // Still set user on token — session works without refresh_token
        }
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
