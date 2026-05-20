"use client";

import React, { useState } from "react";
import useAuth from "hooks/useAuth";
import { useE2eeStore } from "store/e2eStore";
import { generateE2EKeyPair, wrapPrivateKey, unwrapPrivateKey } from "@lib/e2e";
import { toast } from "react-toastify";

export default function E2ESecurityPinModal() {
  const { user, updateUser } = useAuth();
  const { needsSetup, needsRestore, setKeys, clearKeys } = useE2eeStore();

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!needsSetup && !needsRestore) return null;

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Generate new P-256 ECDH Keypair
      const keypair = await generateE2EKeyPair();

      // 2. Wrap private key with user PIN and salt (using user ID or phone number as salt)
      const salt = user?.id || user?.phoneNumber || "static_salt";
      const wrappedPrivateKey = await wrapPrivateKey(keypair.privateKey, pin, salt);

      // 3. Upload public key and wrapped private key to server
      // Wait, updateUser uses axios.put("/db/user", { id, updates: { [key]: value } })
      // We will perform updates for both publicKey and encryptedPrivateKey.
      // Since AuthContext's updateUser is designed for one key-value pair, let's update publicKey first then encryptedPrivateKey, or do a direct axios call.
      // Let's use the direct axios PUT /db/user or do two calls. Better yet, since we have the axiosClient in hooks or we can just call updateUser consecutively.
      // Let's see: AuthContext's updateUser can handle key/value. Let's make sure it updates both!
      await updateUser("publicKey", keypair.publicKey);
      await updateUser("encryptedPrivateKey", wrappedPrivateKey);

      // 4. Save to local storage
      localStorage.setItem("e2e_public_key", keypair.publicKey);
      localStorage.setItem("e2e_private_key", keypair.privateKey);

      // 5. Update Zustand store
      setKeys(keypair.publicKey, keypair.privateKey);
      toast.success("End-to-End Encryption activated successfully!");
    } catch (err) {
      console.error("E2EE Setup failed:", err);
      setError("Failed to set up E2EE. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pin) {
      setError("Please enter your Security PIN");
      return;
    }

    setIsLoading(true);
    try {
      const salt = user?.id || user?.phoneNumber || "static_salt";
      const encryptedKey = user?.encryptedPrivateKey;

      if (!encryptedKey) {
        setError("No recovery key found on server. Try resetting E2EE.");
        setIsLoading(false);
        return;
      }

      // Unwrap/decrypt the private key using the PIN
      const decryptedPrivateKey = await unwrapPrivateKey(encryptedKey, pin, salt);

      // If unwrapping completes, it means the private key is valid!
      // Save locally
      localStorage.setItem("e2e_public_key", user.publicKey || "");
      localStorage.setItem("e2e_private_key", decryptedPrivateKey);

      // Update Zustand
      setKeys(user.publicKey || "", decryptedPrivateKey);
      toast.success("Security keys successfully synchronized!");
    } catch (err) {
      console.error("PIN verification failed:", err);
      setError("Incorrect PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReset() {
    if (!confirm("WARNING: Resetting your E2E security keys will regenerate your cryptographic identities. Older E2EE messages sent or received in the past will become permanently unreadable. Do you wish to proceed?")) {
      return;
    }

    setIsLoading(true);
    try {
      // Clear server keys
      await updateUser("publicKey", "");
      await updateUser("encryptedPrivateKey", "");

      // Clear local storage
      localStorage.removeItem("e2e_public_key");
      localStorage.removeItem("e2e_private_key");

      // Reset store
      clearKeys();

      // Trigger E2EE setup again
      useE2eeStore.getState().setNeedsSetup(true);
      useE2eeStore.getState().setNeedsRestore(false);

      setPin("");
      setConfirmPin("");
      setError("");
      toast.info("Security keys reset. Please configure a new PIN.");
    } catch (err) {
      console.error("Reset failed:", err);
      toast.error("Failed to reset keys. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 overflow-y-auto">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative backdrop-blur-md">
        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-200 to-indigo-200 bg-clip-text text-transparent">
            {needsSetup ? "Set Up Secure Chat" : "Sync Security Keys"}
          </h2>
          <p className="text-zinc-400 text-sm mt-2 px-2">
            {needsSetup
              ? "All your 1-on-1 chats are protected with private cryptographic keys. Set a PIN to sync them across other devices."
              : "To decrypt and sync your historical messages, enter the E2EE Security PIN you previously set up."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {needsSetup ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">
                Enter Security PIN
              </label>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-3 w-full text-center text-xl tracking-widest font-mono text-white outline-none"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">
                Confirm Security PIN
              </label>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-3 w-full text-center text-xl tracking-widest font-mono text-white outline-none"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg p-3 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition duration-150 flex items-center justify-center gap-2 cursor-pointer mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating Keys...</span>
                </>
              ) : (
                <span>Activate Security Key</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRestore} className="space-y-4">
            <div>
              <label className="block text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">
                Enter your Security PIN
              </label>
              <input
                type="password"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="bg-zinc-900/60 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-3 w-full text-center text-xl tracking-widest font-mono text-white outline-none"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3 pt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg p-3 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Decrypting...</span>
                  </>
                ) : (
                  <span>Restore Chats</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-medium rounded-lg p-2.5 active:scale-[0.98] transition duration-150 text-sm cursor-pointer"
                disabled={isLoading}
              >
                Reset Security Keys
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
