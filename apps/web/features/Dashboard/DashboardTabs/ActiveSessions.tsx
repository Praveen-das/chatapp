import { MouseEvent } from "react";
import Header from "./SharedComponents/Header";
import { HandRaisedIcon } from "@heroicons/react/24/outline";
import { useSessionStore } from "store/sessionStore";
import useSocket from "context/SocketProvider";
import { useStore } from "store/global";
import moment from "moment";
import BrowserAvatar from "@features/ui/BrowserAvatar";
import { ISession } from "@repo/interfaces/sessionInterface";
import useAxios from "@hooks/useAxios";

function ActiveSessions() {
  const [currentSession, ...activeSessions] = useSessionStore((s) => s.activeSessions);
  const { clearAllSessions } = useSessionStore((s) => s.actions);
  const axios = useAxios();

  async function terminateAllSessions() {
    try {
      clearAllSessions(currentSession?.sessionId!);

      const body = {
        sessionIds: activeSessions.map((session) => session.sessionId),
        userId: currentSession?.userId,
      };

      const res = await axios.post(`/session/clear`, JSON.stringify(body));
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Active sessions" mainTab="settings" />
      <div className="flex flex-col h-full max-sm:gap-2 gap-4 max-sm:mt-2 sm:mt-4 overflow-y-auto no-scrollbar">
        {currentSession && (
          <div className="flex flex-col gap-4">
            <span className="text-sm max-sm:px-0 px-4">This device</span>
            <Session session={currentSession} />
          </div>
        )}
        {!!activeSessions.length && (
          <>
            <div
              onClick={terminateAllSessions}
              className="btn btn-error btn-outline text-white overflow-hidden max-sm:px-0 mx-4"
            >
              <HandRaisedIcon className="size-5" />
              Terminate other sessions
            </div>
            <div className="flex flex-col gap-4 h-full mt-4">
              <span className="text-sm max-sm:px-0 px-4">Active sessions - {activeSessions.length}</span>
              <div className="flex flex-col pb-2 gap-2">
                {activeSessions.map((session) => (
                  <Session key={session.sessionId} session={session} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Session({ session }: { session: ISession }) {
  const setModal = useStore((s) => s.setModal);

  const device = session.data;

  function onClick() {
    setModal({ open: true, activeModal: "viewSessionModal", state: session });
  }

  const lastActive = moment(new Date(device.timestamp)).format("LLL");

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 w-full px-4 py-4 hover:bg-base-200 rounded-2xl cursor-pointer`}
      key={session.sessionId}
    >
      <BrowserAvatar browser={device.browser as any} className="min-w-10 min-h-10 size-10" />
      <div className="flex flex-col">
        <span className="whitespace-nowrap text-base">{`${device.browser} (${device.os})`}</span>
        <div className="grid">
          <label className="whitespace-nowrap text-sm text-white/50 truncate">
            {`${lastActive} ${device.city ? "-" + " " + device.city : ""}`}
          </label>
        </div>
      </div>
    </div>
  );
}

export default ActiveSessions;
