import { deleteSessionFromDb } from "@actions/session";
import { useStore } from "../../../store/global";
import { IModal } from "@interfaces/modalInterface";
import useSocket from "context/SocketProvider";
import moment from "moment";
import { MouseEvent } from "react";
import { useSessionStore } from "store/sessionStore";
import { ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import BrowserAvatar from "../BrowserAvatar";
import { ISession } from "@interfaces/sessionInterface";
import { browserIcons } from "config/browserIcons";

const ViewSessionModal = () => {
  const setModal = useStore((s) => s.setModal);
  const modal = useStore<IModal<ISession> | null>((s) => s.modal);
  const { sendRequestToEndSession } = useSocket();
  const { removeSession } = useSessionStore.getState();

  const session = modal?.state!;
  const device = session.data.deviceData

  async function terminateSession(e: MouseEvent<HTMLDivElement>) {
    if (!session.sessionId) return console.error("SessionId not found");
    const sessionId = session.sessionId;
    deleteSessionFromDb(sessionId);
    removeSession(sessionId);
    sendRequestToEndSession(sessionId);
    setModal(null);
  }

  const lastActive = moment(new Date(device.timestamp)).format(
    "LLL"
  );

  return (
    <div className="modal-box flex flex-col items-center gap-8 px-8 py-12 w-full max-w-xs bg-[--modal]">
      <BrowserAvatar
        browser={device.browser as keyof typeof browserIcons}
        className="size-20"
      />
      <span className="text-center text-xl block">{`${device.browser} (${device.os})`}</span>
      <div className="w-full text-center grid gap-2">
        <div className="flex items-center gap-2 text-sm text-white/50 whitespace-nowrap">
          <ClockIcon className="size-4" />
          {lastActive}
        </div>
        {device.city && (
          <div className="flex items-center gap-2 text-sm text-white/50 whitespace-nowrap">
            <MapPinIcon className="size-4" />
            {device.city}
          </div>
        )}
      </div>
      <div className="flex w-full justify-stretch gap-4 mx-auto">
        <form className="w-full" method="dialog">
          <div className="w-full">
            <button className={`btn btn-sm w-full`}>Cancel</button>
          </div>
        </form>
        <div className="w-full">
          <div
            tabIndex={0}
            onClick={terminateSession}
            className="btn btn-sm btn-secondary w-full"
          >
            Logout
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSessionModal;
