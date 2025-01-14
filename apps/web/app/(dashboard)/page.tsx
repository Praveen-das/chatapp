import ChatWindow from "@components/ChatWindow/ChatWindow";
import Dashboard from "@components/Dashboard";
import GroupInvitation from "@components/GroupInvitation/GroupInvitation";
import Modal from "@components/ui/Modal";

export default function () {
  return (
    <div className="flex relative w-full h-screen max-sm:py-0 p-4 sm:gap-4 bg-base-300 ">
      <Modal />
      <GroupInvitation />
      <Dashboard />
      <ChatWindow />
    </div>
  );
}
