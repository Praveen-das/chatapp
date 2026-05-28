"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import useAuth from "hooks/useAuth";
import { useE2eeStore } from "store/e2eStore";
import { wrapPrivateKey, unwrapPrivateKey } from "@lib/e2e";
import { toast } from "react-toastify";
import FramerWrapper from "../MotionWrapper";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function E2ESecurityPinModal() {
  const { user, updateUser } = useAuth();
  const showBackupModal = useE2eeStore((s) => s.showBackupModal);
  const hasCloudBackup = useE2eeStore((s) => s.hasCloudBackup);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0); // 0 = idle, 1 = verify current PIN, 2 = set new PIN

  const pathname = usePathname();

  // Suppress modal on /register — the inline RecoveryKeyForm handles restore there
  if (pathname === "/register") return null;

  // Only render if backup modal is active
  if (!showBackupModal) return null;

  // ─── Mode 2: Settings Backup (manual opt-in from Settings) ───

  async function handleEnableBackup(e: React.FormEvent) {
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
      const existingPrivateKey = useE2eeStore.getState().myPrivateKeyJwk;
      if (!existingPrivateKey) {
        setError("No local recovery key found. Please restart the app.");
        setIsLoading(false);
        return;
      }

      const salt = user?.id || user?.phoneNumber || "static_salt";
      const wrappedPrivateKey = await wrapPrivateKey(existingPrivateKey, pin, salt);

      await updateUser("encryptedPrivateKey", wrappedPrivateKey);

      useE2eeStore.getState().setHasCloudBackup(true);
      useE2eeStore.getState().setShowBackupModal(false);
      toast.success("Backup enabled! Your recovery key is securely backed up.");
      resetForm();
    } catch (err) {
      console.error("Backup setup failed:", err);
      setError("Failed to enable backup. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Secure Reset Flow ───

  async function handleResetVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!currentPin) {
      setError("Please enter your current PIN");
      return;
    }

    setIsLoading(true);
    try {
      const salt = user?.id || user?.phoneNumber || "static_salt";
      const encryptedKey = user?.encryptedPrivateKey;

      if (!encryptedKey) {
        setError("No recovery key found. Cannot verify.");
        setIsLoading(false);
        return;
      }

      // Attempt to decrypt — this validates the current PIN
      await unwrapPrivateKey(encryptedKey, currentPin, salt);

      // PIN verified, move to step 2
      setResetStep(2);
      setError("");
    } catch {
      setError("Incorrect PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetComplete(e: React.FormEvent) {
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

    if (pin === currentPin) {
      setError("New PIN must be different from current PIN");
      return;
    }

    setIsLoading(true);
    try {
      const existingPrivateKey = useE2eeStore.getState().myPrivateKeyJwk;
      if (!existingPrivateKey) {
        setError("No local recovery key found. Please restart the app.");
        setIsLoading(false);
        return;
      }

      const salt = user?.id || user?.phoneNumber || "static_salt";
      const wrappedPrivateKey = await wrapPrivateKey(existingPrivateKey, pin, salt);

      await updateUser("encryptedPrivateKey", wrappedPrivateKey);

      useE2eeStore.getState().setShowBackupModal(false);
      toast.success("Recovery key PIN has been reset.");
      resetForm();
    } catch (err) {
      console.error("Reset failed:", err);
      setError("Failed to reset PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDismiss() {
    if (showBackupModal) {
      useE2eeStore.getState().setShowBackupModal(false);
    }
    resetForm();
  }

  function resetForm() {
    setPin("");
    setConfirmPin("");
    setCurrentPin("");
    setError("");
    setResetStep(0);
  }

  // ─── Render ───

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleDismiss()}
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4"
    >
      <FramerWrapper className="modal-box flex flex-col items-center p-8 gap-6 w-full max-w-sm bg-[--modal] shadow-xl overflow-y-auto max-h-[90vh] custom-scrollbar">
        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center gap-3 mt-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
              hasCloudBackup
                ? "bg-success/10 text-success border-success/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold">Recovery Key</h2>
          <p className="text-sm opacity-70 leading-relaxed max-w-[280px]">
            {hasCloudBackup
              ? resetStep === 1
                ? "Verify your current PIN to proceed."
                : resetStep === 2
                  ? "Set a new Recovery key."
                  : "Your recovery key is active and ready to restore your chats when needed."
              : "Create a recovery key for your chat history. Keep it safe — without it, your chats can’t be restored."}
          </p>
        </div>

        {error && (
          <div className="w-full p-3 bg-error/10 border border-error/20 rounded-xl text-center text-sm text-error font-medium">
            {error}
          </div>
        )}

        {/* ─── Mode 2: Settings Backup ─── */}
        <div className="w-full">
          {hasCloudBackup ? (
            /* Backup is active — show reset flow */
            <div className="w-full">
              {resetStep === 0 && (
                <div className="flex flex-col w-full gap-2.5 mx-auto mt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="btn btn-primary w-full"
                    disabled={isLoading}
                  >
                    Reset PIN
                  </button>
                  <button type="button" onClick={handleDismiss} className="btn w-full [--b2:--b1]" disabled={isLoading}>
                    Close
                  </button>
                </div>
              )}

              {resetStep === 1 && (
                <form onSubmit={handleResetVerify} className="w-full space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold opacity-70 uppercase pl-1">Current PIN</label>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={6}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="input input-bordered w-full text-center text-xl tracking-[0.5em] font-mono bg-base-200/50 focus:border-primary focus:outline-none"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  <div className="flex w-full justify-stretch gap-3 mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep(0);
                        setError("");
                        setCurrentPin("");
                      }}
                      className="btn flex-1 [--b2:--b1]"
                      disabled={isLoading}
                    >
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary flex-1" disabled={isLoading}>
                      {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Verify"}
                    </button>
                  </div>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleResetComplete} className="w-full space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold opacity-70 uppercase pl-1">New PIN</label>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="input input-bordered w-full text-center text-xl tracking-[0.5em] font-mono bg-base-200/50 focus:border-primary focus:outline-none"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold opacity-70 uppercase pl-1">Confirm New PIN</label>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="input input-bordered w-full text-center text-xl tracking-[0.5em] font-mono bg-base-200/50 focus:border-primary focus:outline-none"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex w-full justify-stretch gap-3 mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep(1);
                        setError("");
                        setPin("");
                        setConfirmPin("");
                      }}
                      className="btn flex-1 [--b2:--b1]"
                      disabled={isLoading}
                    >
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary flex-1" disabled={isLoading}>
                      {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Reset"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Backup not enabled — show PIN setup form */
            <form onSubmit={handleEnableBackup} className="w-full space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-70 uppercase pl-1">Create PIN</label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="input input-bordered w-full text-center text-xl tracking-[0.5em] font-mono bg-base-200/50 focus:border-primary focus:outline-none"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold opacity-70 uppercase pl-1">Confirm PIN</label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="input input-bordered w-full text-center text-xl tracking-[0.5em] font-mono bg-base-200/50 focus:border-primary focus:outline-none"
                  disabled={isLoading}
                />
              </div>

              <div className="flex w-full justify-stretch gap-3 mx-auto pt-2">
                <button type="button" onClick={handleDismiss} className="btn flex-1 [--b2:--b1]" disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={isLoading}>
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Enable"}
                </button>
              </div>
            </form>
          )}
        </div>
      </FramerWrapper>
    </div>
  );
}
