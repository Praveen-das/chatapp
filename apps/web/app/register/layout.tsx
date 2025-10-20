import Modal from "@features/ui/Modal";
import { ReactNode } from "react";

async function Layout({ children }: { children: ReactNode }) {

  return (
    <div className="flex justify-center items-center gap-8 w-full h-screen bg-base-300 text-base">
      <Modal />
      {children}
    </div>
  );
}

export default Layout;
