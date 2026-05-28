"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console or your error monitoring service
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F19] p-6 text-center text-white">
      <div className="max-w-md w-full space-y-6 p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40">
        {/* Subtle, pulsing exclamation icon container */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 animate-pulse border border-red-500/20">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-400 to-amber-300 bg-clip-text text-transparent">
            Initialization Failed
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {error.message || "An unexpected error occurred while syncing your chat session."}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-300 transition-all duration-200"
          >
            Reload Page
          </button>
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/20 transition-all duration-200 active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
