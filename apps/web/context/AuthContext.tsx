"use client";
import useAxios from "@hooks/useAxios";
import { useSearch } from "@hooks/useSearch";
import socket from "@lib/ws";
import { IUser } from "@repo/interfaces/userInterface";
import { signOut as _signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useAttachments } from "store/attachments";
import { useStore } from "store/global";
import { useMenu } from "store/menu";
import { useSessionStore } from "store/sessionStore";
import { refreshToken, type RefreshResult } from "@actions/session";
import useAccessToken from "@hooks/useAccessToken";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { useE2eeStore } from "store/e2eStore";
import { generateE2EKeyPair } from "@lib/e2e";

const useContextData = () => {
  const axios = useAxios();
  const router = useRouter();
  const { data: session, update } = useSession({
    onUnauthenticated: () => {},
    required: true,
  });
  const { setAccessToken } = useAccessToken();

  const [isMounted, setMounted] = useState(false);
  const isSigningOut = useRef(false);
  const hasInitialized = useRef(false);
  const [user, setUser] = useState(session?.user);
  const path = usePathname();

  useEffect(() => {
    if (session?.user) {
      isSigningOut.current = false;
      setUser(session.user);
    } else if (!isSigningOut.current) {
      setUser(undefined);
      hasInitialized.current = false;
    }
  }, [session?.user]);

  useEffect(() => {
    async function initE2eeKeys() {
      if (!user?.id) {
        useE2eeStore.getState().clearKeys();
        return;
      }

      const localPrivateKey = localStorage.getItem("e2e_private_key");
      const localPublicKey = localStorage.getItem("e2e_public_key");

      if (localPrivateKey && localPublicKey) {
        // Case 1: Local keys exist — load them
        useE2eeStore.getState().setKeys(localPublicKey, localPrivateKey);

        if (user.encryptedPrivateKey) {
          useE2eeStore.getState().setHasCloudBackup(true);
        }
      } else if (user.encryptedPrivateKey && user.publicKey) {
        // Case 2: Server has wrapped key but local is missing — redirect to recovery
        useE2eeStore.getState().setNeedsRestore(true);
        useE2eeStore.getState().setHasCloudBackup(true);

        if (path !== "/register") {
          router.replace("/register");
        }
      } else {
        // Case 3: Fresh user — silently generate keys
        try {
          const keypair = await generateE2EKeyPair();
          localStorage.setItem("e2e_public_key", keypair.publicKey);
          localStorage.setItem("e2e_private_key", keypair.privateKey);
          await updateUser("publicKey", keypair.publicKey);
          useE2eeStore.getState().setKeys(keypair.publicKey, keypair.privateKey);
        } catch (error) {
          console.error("Silent E2EE key generation failed:", error);
        }
      }
    }

    initE2eeKeys();
  }, [user]);

  useEffect(() => {
    async function init() {
      if (hasInitialized.current) return;
      hasInitialized.current = true;
      try {
        if (!user) return;

        const MAX_RETRIES = 3;
        let result: RefreshResult = { error: "server_unavailable" };

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          result = await refreshToken();

          // Success or definitive auth failure — stop retrying
          if (result.token || result.error === "auth_failed") break;

          // Transient failure — wait with backoff before retrying
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          }
        }

        if (result.token) {
          setAccessToken(result.token);
        } else if (result.error === "auth_failed") {
          await signOut();
          return;
        } else {
          // All retries exhausted — server is down but session may still be valid
          toast.error("Server is temporarily unavailable. Please try again later.");
        }
      } catch (error) {
        console.error("auth context initialization error:", error);
        await signOut();
      } finally {
        setMounted(true);
      }
    }

    if (user && !hasInitialized.current) init();
  }, [user]);

  useEffect(() => {
    if (path === "/register") {
      useStore.getState().reset();
      useAttachments.getState().reset();
      useMenu.getState().reset();
      useSearch.getState().reset();
      useSessionStore.getState().reset();
      useConversationStore.getState().reset();
      useMessageStore.getState().reset();
    }
  }, [path]);

  const updateSession = async (updatedUser: IUser) => {
    try {
      await update({ user: updatedUser });
    } catch (error) {
      console.log(error);
    }
  };

  const updateUser = useCallback(
    async (key: string, value: any) => {
      try {
        const updatedUser = await axios
          .put(`/db/user`, { id: user?.id, updates: { [key]: value } })
          .then((res) => res.data);

        if (updatedUser.error) {
          if (updatedUser.error.code === 11000) {
            toast.error("Username already exists");
            return;
          }
          toast.error(updatedUser.error.message);
          return;
        }

        if (updatedUser.errors) {
          updatedUser.errors.forEach((error: any) => {
            toast.error(error.message);
          });
          return;
        }

        await updateSession(updatedUser);
        toast.success(`${key} updated successfully`);
      } catch (error) {
        console.log(error);
      }
    },
    [axios, user],
  );

  async function signOut() {
    isSigningOut.current = true;
    try {
      const response = await _signOut({ callbackUrl: "/register", redirect: false });
      router.replace(response.url);
      socket.disconnect();
    } catch (error) {
      console.error("signOut failed:", error);
    } finally {
      // Always reset flags so the app can recover if signOut itself fails
      isSigningOut.current = false;
      hasInitialized.current = false;
    }
  }

  return {
    isMounted,
    setMounted,
    user,
    updateUser,
    updateSession,
    signOut,
    session,
  };
};

type AuthContextType = ReturnType<typeof useContextData>;

export const Context = createContext<AuthContextType | null>(null);

function AuthContext({ children }: PropsWithChildren) {
  const value = useContextData();
  const path = usePathname();
  const isE2eeInitialized = useE2eeStore((s) => s.isInitialized);
  const needsRestore = useE2eeStore((s) => s.needsRestore);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[--base-300-100] gap-4">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const isAuth = !!value.user?.id;
  const shouldBlock = isAuth && (!isE2eeInitialized || needsRestore) && path !== "/register";

  if (shouldBlock) {
    return (
      <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[--base-300-100] gap-4">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export default AuthContext;
