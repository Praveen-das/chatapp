"use client";
import { APP_NAME } from "config/constants";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "public/favicon.svg";

function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MaxLoaded = generateRandomNumber(70, 90);

interface LoadingContextType {
  finishLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingPage provider");
  }
  return context;
}

export function LoadingPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const time = setInterval(
      () => {
        setValue((s) => {
          const next = Math.min(s + Math.floor(Math.random() * 10), MaxLoaded);
          if (next >= MaxLoaded) clearInterval(time);
          return next;
        });
      },
      300 + Math.random() * 200,
    );

    return () => clearInterval(time);
  }, []);

  const finishLoading = () => {
    setIsLoaded(true);
  };

  useEffect(() => {
    if (pathname !== "/") {
      setIsLoaded(true);
      setIsMounted(true);
    }
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ finishLoading }}>
      {children}
      {(!isLoaded || !isMounted) && (
        <div className="fixed inset-0 z-[9999999] w-full h-screen flex justify-center items-center bg-[--base-300-100] text-base-content">
          <div className="grid place-items-center gap-2 text-center">
            <Logo width={70} height={70} className="text-primary" />
            <div className="text-xl font-semibold tracking-wide">{APP_NAME}</div>
            <div className="text-sm mt-2 opacity-60">
              Loading your chats {value !== 0 && `${isLoaded ? 100 : value}%`}
            </div>
            <div className="w-56 h-1 bg-base-content/10 rounded-full mt-2 overflow-hidden">
              <div
                onTransitionEnd={() => isLoaded && setIsMounted(true)}
                style={{ width: `${isLoaded ? 100 : value}%` }}
                className="h-full bg-primary duration-500 ease-out transition-all"
              />
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export default LoadingPage;
