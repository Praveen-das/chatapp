import { BellAlertIcon, BellSlashIcon } from "@heroicons/react/24/solid";
import useIndexedDb from "@lib/idb";
import { ChangeEvent, useEffect, useState } from "react";
// import db from "@lib/idb";
import { useStore } from "store/global";

function NotificationToggle({ id }: { id: string }) {
  const [checked, setChecked] = useState(true);
  const idb = useIndexedDb()

  useEffect(() => {
    idb.get(id).then((res) => setChecked(!Boolean(res)));
  }, [id,idb]);

  async function handleToggleNotification(e: ChangeEvent<HTMLInputElement>) {
    const isChecked = e.target.checked;
    if (Notification.permission === "granted") {
      if (isChecked) idb.del(id).then(() => setChecked(true));
      else idb.set(id, true).then(() => setChecked(false));
    } else {
      useStore.getState().setModal({ activeModal: "notificationBlockedAlert" ,open:true});
    }
  }

  return (
    <div
      className={`capitalize w-full flex items-center justify-between gap-4`}
    >
      Notification
      <label className="grid cursor-pointer place-items-center overflow-clip rounded-full">
        <input
          onChange={handleToggleNotification}
          type="checkbox"
          value="synthwave"
          checked={checked}
          className="toggle theme-controller border-none col-span-2 col-start-1 row-start-1"
        />
        <BellSlashIcon className="size-4 text-base-100 col-start-1 row-start-1" />
        <BellAlertIcon className="size-4 text-base-100 col-start-2 row-start-1" />
      </label>
    </div>
  );
}

export default NotificationToggle;
