"use client";

import { useTheme } from "@hooks/useTheme";
import { AppContext } from "context/AppContext";
import AuthContext from "context/AuthContext";
import { SocketProvider } from "context/SocketProvider";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";
import { ToastContainer } from "react-toastify";

function Provider({ children }: PropsWithChildren) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthContext>
        <SocketProvider>
          <AppContext>
            <ThemeProvider disableTransitionOnChange enableSystem>
              <ToastContainer limit={3} position="bottom-left" theme="dark" />
              <InitTheme />
              {children}
            </ThemeProvider>
          </AppContext>
        </SocketProvider>
      </AuthContext>
    </SessionProvider>
  );
}

function InitTheme() {
  useTheme();
  return null;
}

export default Provider;
