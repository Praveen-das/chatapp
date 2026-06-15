"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { unwrapPrivateKey, generateE2EKeyPair } from "@lib/e2e";
import { useE2eeStore } from "store/e2eStore";
import useAuth from "hooks/useAuth";
import RenderErrorMessage from "./RenderErrorMessage";
import { clearAllConversations } from "@lib/conversation";

export default function RecoveryKeyForm() {
  const { user: currentUser, updateUser, updatePublicKey } = useAuth();
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pin) {
      setError("Please enter your PIN");
      return;
    }

    const targetUser = currentUser;

    if (!targetUser?.encryptedPrivateKey || !targetUser?.publicKey) {
      setError("No recovery key found. Try starting fresh.");
      return;
    }

    setIsLoading(true);
    let shouldKeepLoading = false;

    try {
      const salt = targetUser.id || targetUser.phoneNumber || "static_salt";
      const decryptedPrivateKey = await unwrapPrivateKey(targetUser.encryptedPrivateKey, pin, salt);

      localStorage.setItem("e2e_public_key", targetUser.publicKey);
      localStorage.setItem("e2e_private_key", decryptedPrivateKey);

      useE2eeStore.getState().setKeys(targetUser.publicKey, decryptedPrivateKey);
      useE2eeStore.getState().setHasCloudBackup(true);

      shouldKeepLoading = true;
      router.replace("/");
    } catch {
      setError("Incorrect PIN. Please try again.");
    } finally {
      if (!shouldKeepLoading) {
        setIsLoading(false);
      }
    }
  }

  async function handleSkip() {
    // Generate fresh keys — old encrypted messages will be unreadable
    setIsLoading(true);
    let shouldKeepLoading = false;

    try {
      const keypair = await generateE2EKeyPair();

      localStorage.setItem("e2e_public_key", keypair.publicKey);
      localStorage.setItem("e2e_private_key", keypair.privateKey);

      await Promise.all([updatePublicKey(keypair.publicKey), updateUser("encryptedPrivateKey", "")]);

      useE2eeStore.getState().setKeys(keypair.publicKey, keypair.privateKey);
      useE2eeStore.getState().setHasCloudBackup(false);

      clearAllConversations();

      shouldKeepLoading = true;
      router.replace("/");
    } catch (err) {
      console.error("Skip recovery failed:", err);
      setError("Failed to generate new keys. Please try again.");
    } finally {
      if (!shouldKeepLoading) {
        setIsLoading(false);
      }
    }
  }

  if (showConfirmSkip) {
    return (
      <div className="flex flex-col items-center gap-6">
        <motion.div className="w-full flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error border border-error/20 shadow-xs">
            <ExclamationTriangleIcon className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold text-error">Are you sure?</h1>
          <p className="text-center text-sm opacity-70 max-w-[280px] leading-relaxed">
            This action will log you out of all other devices, and{" "}
            <strong>all of your past messages will be lost.</strong>{" "}
          </p>

          <div className="w-full space-y-4 max-w-xs mx-auto">
            <RenderErrorMessage errorMessage={error} />

            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="btn btn-block btn-error text-[--black-white]"
            >
              {isLoading ? "Starting Fresh..." : "Yes, Start Fresh"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowConfirmSkip(false);
              }}
              disabled={isLoading}
              className="btn btn-block btn-ghost text-xs opacity-70 hover:opacity-100"
            >
              Cancel and Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div className="w-full flex flex-col items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xs">
          <ShieldCheckIcon className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold">Recovery Key</h1>
        <p className="text-center text-sm opacity-70 max-w-[280px] leading-relaxed">
          Enter your PIN to restore your chats.
        </p>

        <form onSubmit={handleRestore} className="w-full space-y-5 max-w-xs mx-auto">
          <input
            type="text"
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setError("");
              setPin(e.target.value.replace(/\D/g, ""));
            }}
            placeholder="••••••"
            className="input input-bordered w-full text-center text-xl tracking-[0.5em] font-mono bg-base-200/50 focus:border-primary focus:outline-none"
            disabled={isLoading}
            autoFocus
          />

          <RenderErrorMessage errorMessage={error} />

          <button type="submit" disabled={isLoading} className="btn btn-block btn-primary text-[--black-white]">
            {isLoading ? "Restoring..." : "Restore Chats"}
          </button>
        </form>
      </motion.div>

      <button
        type="button"
        onClick={() => setShowConfirmSkip(true)}
        disabled={isLoading}
        className="btn btn-ghost btn-sm text-xs opacity-70 hover:opacity-100"
      >
        Skip & Start Fresh
      </button>
    </div>
  );
}
