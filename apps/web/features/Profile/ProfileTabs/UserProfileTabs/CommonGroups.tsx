import { BellAlertIcon, BellSlashIcon } from "@heroicons/react/24/solid";

function CommonGroups() {
  return (
    <div
      className={`capitalize w-full flex items-center justify-between gap-4`}
    >
      Notification
      <label className="grid cursor-pointer place-items-center overflow-clip rounded-full">
        <input
          type="checkbox"
          value="synthwave"
          className="toggle theme-controller border-none col-span-2 col-start-1 row-start-1"
        />
        <BellSlashIcon className="size-4 text-base-100 col-start-1 row-start-1" />
        <BellAlertIcon className="size-4 text-base-100 col-start-2 row-start-1" />
      </label>
    </div>
  );
}

export default CommonGroups;
