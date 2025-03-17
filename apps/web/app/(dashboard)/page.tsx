import ChatWindow from "@features/ChatWindow/ChatWindow";
import Dashboard from "@features/Dashboard";
import GroupInvitation from "@features/GroupInvitation/GroupInvitation";
import Modal from "@features/ui/Modal";
import AppContext from "context/AppContext";
import AuthContext from "context/AuthContext";
import { SockerProvider } from "context/SocketProvider";

export default function () {

  return (
    <AuthContext>
      <SockerProvider>
        <AppContext>
          <div className="flex relative w-full h-screen max-sm:py-0 p-4 sm:gap-4 bg-base-300 ">
            <Modal />
            <GroupInvitation />
            <Dashboard />
            <ChatWindow />
          </div>
        </AppContext>
      </SockerProvider>
    </AuthContext>
  );
}
