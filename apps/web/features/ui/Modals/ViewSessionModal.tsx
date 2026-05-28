import { useStore } from "../../../store/global";
import useSocket from "context/SocketProvider";
import moment from "moment";
import { MouseEvent } from "react";
import { useSessionStore } from "store/sessionStore";
import { ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import BrowserAvatar from "../BrowserAvatar";
import { ISession } from "@repo/interfaces/sessionInterface";
import { browserIcons } from "config/browserIcons";
import { IModal } from "@interfaces/modalInterface";
import FramerWrapper from "../MotionWrapper";

const ViewSessionModal = () => {
  const setModal = useStore((s) => s.setModal);
  const modal = useStore<IModal<ISession> | null>((s) => s.modal);
  const { sendRequestToEndSession } = useSocket();
  const { removeSession } = useSessionStore((s) => s.actions);

  const session = modal?.state!;
  const device = session.data;

  async function terminateSession(e: MouseEvent<HTMLDivElement>) {
    if (!session.sessionId) return console.error("SessionId not found");
    const sessionId = session.sessionId;
    removeSession(sessionId);
    sendRequestToEndSession([sessionId]);
    setModal(false);
  }

  const lastActive = moment(new Date(device.timestamp)).format("LLL");

  return (
    <FramerWrapper className="modal-box flex flex-col items-center gap-6 px-8 py-10 w-full max-w-xs bg-[--modal] rounded-xl shadow-lg backdrop-blur-md">
      <BrowserAvatar browser={device.browser as keyof typeof browserIcons} className="size-20" />
      <span className="text-center text-xl block font-semibold text-base-content">{`${device.browser} (${device.os})`}</span>
      <div className="w-full flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-2 text-sm text-base-content/60 whitespace-nowrap">
          <ClockIcon className="size-5" />
          {lastActive}
        </div>
        {device.city && (
          <div className="flex items-center gap-2 text-sm text-base-content/60 whitespace-nowrap">
            <MapPinIcon className="size-5" />
            {device.city}
          </div>
        )}
      </div>
      <div className="flex flex-col w-full gap-2.5 mx-auto mt-2">
        <div
          tabIndex={0}
          onClick={terminateSession}
          className="btn btn-sm btn-error !text-[--black-white] btn-block font-bold transition-all duration-200 shadow-md hover:shadow-error/10"
        >
          Logout
        </div>
        <form className="w-full" method="dialog">
          <button className="btn btn-sm [--b2:--b1] btn-block font-bold transition-all duration-200">Cancel</button>
        </form>
      </div>
    </FramerWrapper>
  );
};

export default ViewSessionModal;
