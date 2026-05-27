import { XCircleIcon } from "@heroicons/react/24/solid";
import { useStore } from "../../../store/global";
import ModalTitle from "./components/ModalTitle";
import FramerWrapper from "../MotionWrapper";

export const NotificationBlockedAlert = () => {
  return (
    <FramerWrapper className={`modal-box px-0 py-6 relative flex flex-col gap-2 max-w-96 bg-[--modal]`}>
      <ModalTitle>Notifications disabled</ModalTitle>
      <label className="px-6" htmlFor="">
        You have denied notifications. Please enable them in your browser settings to receive notifications.
      </label>
      <div className="px-6 mt-4 ml-auto">
        <form method="dialog">
          <button className="btn [--b2:var(--b1)] px-8 btn-sm">Okay</button>
        </form>
      </div>
    </FramerWrapper>
  );
};
