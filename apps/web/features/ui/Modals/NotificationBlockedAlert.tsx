import { XCircleIcon } from "@heroicons/react/24/solid";
import { useStore } from "../../../store/global";

export const NotificationBlockedAlert = () => {
  const setModal = useStore((s) => s.setModal);

  return (
    <div className="modal-box relative flex flex-col gap-2 max-w-[450px] bg-[--modal]">
      <div className="flex justify-between items-center w-full ">
        <label className="font-bold text-lg" htmlFor="">
          Notifications disabled
        </label>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
          <XCircleIcon className="size-6" />
          </button>
        </form>
      </div>
      <label htmlFor="">
        You have denied notifications. Please enable them in your browser
        settings to receive notifications.
      </label>
    </div>
  );
};
