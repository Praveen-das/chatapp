import ChatWindow from "@features/ChatWindow/ChatWindow";
import Dashboard from "@features/Dashboard";
import GroupInvitation from "@features/GroupInvitation/GroupInvitation";
import Modal from "@features/ui/Modal";

export default function DashboardClient() {
  return (
    <div className="flex relative w-full h-screen max-sm:py-0 p-4 sm:gap-4 bg-[--base-300-100]">
      <Modal />
      <GroupInvitation />
      <Dashboard />
      <ChatWindow />
    </div>
  );
}
