"use client";

import { useTheme } from "@hooks/useTheme";
import AuthContext from "context/AuthContext";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";
import { ToastContainer } from "react-toastify";
import E2ESecurityPinModal from "@features/ui/Modals/E2ESecurityPinModal";
import Loader from "@features/ui/InitialLoader";

function Provider({ children }: PropsWithChildren) {
  return (
    <Loader>
      <SessionProvider refetchOnWindowFocus={false}>
        <AuthContext>
          <ThemeProvider disableTransitionOnChange enableSystem>
            <ToastContainer limit={3} position="bottom-left" theme="dark" />
            <InitTheme />
            <E2ESecurityPinModal />
            {children}
          </ThemeProvider>
        </AuthContext>
      </SessionProvider>
    </Loader>
  );
}

function InitTheme() {
  useTheme();
  return null;
}

export default Provider;
