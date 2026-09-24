"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Weather Dashboard Error</h2>
        <p className="text-xs text-white/50 leading-relaxed">
          An unexpected error occurred while rendering the weather interface. The API endpoints remain operational.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold font-mono transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
