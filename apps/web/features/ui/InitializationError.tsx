"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Logo from "public/favicon.svg";

interface InitializationErrorProps {
  error: Error;
  onRetry: () => void;
}

export default function InitializationError({ error, onRetry }: InitializationErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Add a tiny delay for high-end micro-interaction feedback before calling onRetry
    setTimeout(() => {
      onRetry();
      setIsRetrying(false);
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-[9999999] w-full h-screen flex justify-center items-center bg-[--base-300-100] text-base-content p-6 select-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-sm w-full p-8 rounded-2xl bg-[--base-200-300] border border-base-content/10 shadow-lg backdrop-blur-md z-10 space-y-6 flex flex-col items-center text-center"
      >
        {/* Animated Brand Logo & Overlapping Warning Badge */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, -4, 4, -4, 4, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="opacity-40"
          >
            <Logo width={70} height={70} />
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 220 }}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-error text-white flex items-center justify-center border-4 border-[--base-100-300] shadow-lg"
          >
            <ExclamationTriangleIcon className="size-5 text-white font-bold" />
          </motion.div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold tracking-tight text-base-content"
          >
            Connection Outage
          </motion.h2>
          <p className="text-sm text-base-content/60 max-w-[280px] mx-auto leading-relaxed">
            We couldn't synchronize your local chats with the secure server.
          </p>
        </div>

        {/* Action Buttons Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full pt-1 flex flex-col sm:flex-row justify-stretch gap-3"
        >
          <button
            onClick={() => window.location.reload()}
            className="btn [--b2:--b1] rounded-full h-10 min-h-10 flex-1 font-bold transition-all duration-200"
          >
            <ArrowPathIcon className="size-5 mr-2" />
            Reload
          </button>

          <button
            disabled={isRetrying}
            onClick={handleRetry}
            className="btn btn-primary text-[--black-white] rounded-full h-10 min-h-10 flex-1 font-bold transition-all duration-200 shadow-md hover:shadow-primary/10"
          >
            {isRetrying ? (
              <span className="loading loading-spinner loading-xs mr-2" />
            ) : (
              <ArrowPathIcon className="size-5 mr-2" />
            )}
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
