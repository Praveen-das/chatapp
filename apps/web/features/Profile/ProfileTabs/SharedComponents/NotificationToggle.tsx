import { useTheme } from "@hooks/useTheme";
import useIndexedDb from "@lib/idb";
import { ChangeEvent, useEffect, useState } from "react";
import { useStore } from "store/global";
import classnames from "classnames";

function NotificationToggle({ id }: { id: string }) {
  const [checked, setChecked] = useState(true);
  const idb = useIndexedDb();
  const { isDarkMode, isLightMode } = useTheme();

  useEffect(() => {
    idb.get(id).then((res) => setChecked(!Boolean(res)));
  }, [id, idb]);

  async function handleToggleNotification(e: ChangeEvent<HTMLInputElement>) {
    const isChecked = e.target.checked;
    if (!checked && Notification.permission === "denied")
      useStore.getState().setModal({ activeModal: "notificationBlockedAlert", open: true });
    else {
      if (isChecked) idb.del(id).then(() => setChecked(true));
      else idb.set(id, true).then(() => setChecked(false));
    }
  }

  const className = classnames({
    "toggle-primary": isLightMode,
    "border-none checked:bg-primary": isDarkMode,
  });

  return (
    <div className={`capitalize w-full flex items-center justify-between gap-4`}>
      Notification
      <label className="grid cursor-pointer place-items-center overflow-clip rounded-full">
        <input
          onChange={handleToggleNotification}
          type="checkbox"
          checked={checked}
          className={`toggle toggle-sm ${className}`}
        />
      </label>
    </div>
  );
}

export default NotificationToggle;
