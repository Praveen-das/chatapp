import BrowserAvatar from "@features/ui/BrowserAvatar";
import { HandRaisedIcon } from "@heroicons/react/24/outline";
import useAxios from "@hooks/useAxios";
import { ISession } from "@repo/interfaces/sessionInterface";
import useSocket from "context/SocketProvider";
import moment from "moment";
import { useStore } from "store/global";
import { useSessionStore } from "store/sessionStore";
import Header from "./SharedComponents/Header";

function ActiveSessions() {
  const { sendRequestToEndSession } = useSocket();
  const currentSession = useSessionStore((s) => s.currentSession);
  const activeSessions = useSessionStore((s) => s.activeSessions);
  const { clearAllSessions } = useSessionStore((s) => s.actions);

  async function terminateAllSessions() {
    try {
      clearAllSessions(currentSession?.sessionId!);

      const sessionIds = activeSessions.map((session) => session.sessionId);

      sendRequestToEndSession(sessionIds);
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
              className="btn btn-error btn-outline overflow-hidden max-sm:px-0 mx-4"
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
      className={`group flex items-center gap-4 w-full px-4 py-3 min-h-[75px] rounded-2xl cursor-pointer transition-all duration-150 hover:bg-base-content/[0.03] active:scale-[0.98] outline-none`}
      key={session.sessionId}
    >
      <BrowserAvatar browser={device.browser as any} className="min-w-10 min-h-10 size-10 shrink-0" />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[14px] font-semibold text-base-content/90 truncate">{`${device.browser} (${device.os})`}</span>
        <span className="text-xs text-base-content/50 truncate">
          {`${lastActive} ${device.city ? "• " + device.city : ""}`}
        </span>
      </div>
    </div>
  );
}

export default ActiveSessions;
