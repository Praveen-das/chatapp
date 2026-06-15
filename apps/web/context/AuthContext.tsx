"use client";
import { useLoading } from "@features/ui/InitialLoader";
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
import { clearAllConversations, getActiveUsers } from "@lib/conversation";

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
      if (!user?.id || !isMounted) {
        if (!user?.id) {
          useE2eeStore.getState().clearKeys();
        }
        return;
      }

      let localPrivateKey = localStorage.getItem("e2e_private_key");
      let localPublicKey = localStorage.getItem("e2e_public_key");

      // Verify local keys against the server's public key (if user.publicKey exists)
      // If the server has a public key but local key mismatches, or if the server has no public key, local keys are invalid/stale
      if (localPublicKey && (!user.publicKey || localPublicKey !== user.publicKey)) {
        localStorage.removeItem("e2e_private_key");
        localStorage.removeItem("e2e_public_key");
        useE2eeStore.getState().clearKeys();
        localPrivateKey = null;
        localPublicKey = null;
      }

      if (localPrivateKey && localPublicKey) {
        console.log("e2ee keys exist");
        // Case 1: Local keys exist — load them
        useE2eeStore.getState().setKeys(localPublicKey, localPrivateKey);

        if (user.encryptedPrivateKey) {
          useE2eeStore.getState().setHasCloudBackup(true);
        }
      } else if (user.encryptedPrivateKey && user.publicKey) {
        console.log("needs backup");
        // Case 2: Server has wrapped key but local is missing — redirect to recovery
        useE2eeStore.getState().setNeedsRestore(true);
        useE2eeStore.getState().setHasCloudBackup(true);

        if (path !== "/recover") {
          router.replace("/recover");
          return;
        }
      } else {
        // Case 3: Fresh user — silently generate keys
        try {
          console.log("fresh user");
          const keypair = await generateE2EKeyPair();
          localStorage.setItem("e2e_public_key", keypair.publicKey);
          localStorage.setItem("e2e_private_key", keypair.privateKey);

          clearAllConversations();

          await updatePublicKey(keypair.publicKey);
          useE2eeStore.getState().setKeys(keypair.publicKey, keypair.privateKey);
        } catch (error) {
          console.error("Silent E2EE key generation failed:", error);
        }
      }
    }

    initE2eeKeys();
  }, [user, isMounted]);

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
    async (keyOrUpdates: string | Record<string, any>, value?: any) => {
      const updates = typeof keyOrUpdates === "string" ? { [keyOrUpdates]: value } : keyOrUpdates;
      const label = typeof keyOrUpdates === "string" ? keyOrUpdates : Object.keys(keyOrUpdates).join(", ");

      try {
        const updatedUser = await axios
          .put(`/db/user`, { id: user?.id, updates })
          .then((res) => {
            console.log("updateUser response:", res);
            return res.data;
          })
          .catch((err) => {
            console.log("updateUser error:", err);
            throw err;
          });

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
        toast.success(`${label} updated successfully`);
      } catch (error) {
        console.log(error);
      }
    },
    [axios, user],
  );

  const updatePublicKey = useCallback(
    async (publicKey: string) => {
      try {
        const updatedUser = await axios
          .put(`/db/user/public-key`, { userId: user?.id, publicKey })
          .then((res) => {
            console.log("updatePublicKey response:", res);
            return res.data;
          })
          .catch((err) => {
            console.log("updatePublicKey error:", err);
            throw err;
          });

        if (updatedUser.error) {
          toast.error(updatedUser.error.message);
          return;
        }

        await updateSession(updatedUser);

        // Broadcast public key update to active chat participants
        try {
          const activeUsers = getActiveUsers().map((u) => u.id);
          const groupMembers = useConversationStore.getState().conversations.reduce<Set<string>>((i, c) => {
            if (c?.host === "user" || c?.host === "group") c.members.forEach((m) => i.add(m.userId));
            return i;
          }, new Set());
          const targetUserIds = [...new Set([...activeUsers, ...groupMembers])].filter((id) => id !== user?.id);

          if (targetUserIds.length > 0) {
            const publicKeyHistory = updatedUser.publicKeyHistory;

            socket.emit("UPDATE_USER_PUBLIC_KEY", {
              userId: user?.id,
              publicKey,
              publicKeyHistory,
              targetUserIds,
            });
          }
        } catch (e) {
          console.error("Failed to broadcast E2EE public key:", e);
        }
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
    updatePublicKey,
    updateSession,
    signOut,
    session,
  };
};

type AuthContextType = ReturnType<typeof useContextData>;

export const Context = createContext<AuthContextType | null>(null);

function AuthContext({ children }: PropsWithChildren) {
  const value = useContextData();

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export default AuthContext;
