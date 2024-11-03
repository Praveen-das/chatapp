import ChatWindow from "@components/ChatWindow/ChatWindow";
import Dashboard from "@components/Dashboard/Dashboard";
import GroupInvitation from "@components/GroupInvitation/GroupInvitation";
import Modal from "@components/ui/Modal";

export default function () {
  return (
    <>
      <Modal />
      <GroupInvitation />

      <div className="flex relative w-full h-screen max-sm:py-0 p-4 sm:gap-4 bg-base-300 ">
        <Dashboard />
        <ChatWindow />
      </div>

    </>
  );
}
