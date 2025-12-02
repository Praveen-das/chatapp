"use client";

import Header from "./SharedComponents/Header";

const checkBoxStyle = "checkbox checkbox-primary [--chkfg:oklch(var(--b3))] checkbox-sm";

function AiSettings() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Ai Assistant" mainTab="settings" />
      <div className="flex flex-col max-sm:gap-8 gap-10 text-sm w-full overflow-y-scroll no-scrollbar py-4">
        <div className="grid gap-4 max-sm:px-0 px-4">
          <label className="text-sm text-primary" htmlFor="Theme">
            Manage Profile Visibility
          </label>
          <div className="form-control pl-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                name="hide_profilepicture"
                // onChange={handleChangingProfileRules}
                // checked={!user?.rules?.includes("hide_profilepicture")}
                type="checkbox"
                className={checkBoxStyle}
              />
              <span className="label-text">Profile Picture</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiSettings;
