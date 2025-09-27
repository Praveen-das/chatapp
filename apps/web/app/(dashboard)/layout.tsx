import Modal from "@features/ui/Modal";
import { AppContext } from "context/AppContext";
import { SocketProvider } from "context/SocketProvider";
import { ReactNode } from "react";

async function Layout({ children }: { children: ReactNode }) {
  return (
    <SocketProvider>
      <AppContext>
        <Modal />
        {children}
      </AppContext>
    </SocketProvider>
  );
}

export default Layout;
