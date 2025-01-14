"use client";

import { useTheme } from "next-themes";
import React, { ChangeEvent, useEffect, useState } from "react";
import { getSystemTheme } from "@lib/theme";
import { useStore } from "../../../store/global";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { usePersistentStore } from "../../../store/persistentStore";
import COLORS from "config/themes";
import Header from "../components/Header";

declare module "csstype" {
  interface Properties {
    "--tw-ring-color"?: string;
  }
}

function GeneralSettings() {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const setModal = useStore((s) => s.setModal);
  const { sendUserRuleChangeRequest } = useSocket();

  const userNotificationPref = usePersistentStore(
    (s) => s.userNotificationPref
  );
  const setUserNotificationPref = usePersistentStore(
    (s) => s.setUserNotificationPref
  );

  const themes = Object.values(COLORS).map((key) => key.replace("#", ""));
  const mode = resolvedTheme?.split("-")[0];
  const [bgcolor, setBgcolor] = useState("");

  function handleMode(e: ChangeEvent<HTMLInputElement>) {
    const selectedTheme = e.target.value;
    if (selectedTheme === "system") {
      const system_theme = getSystemTheme();
      setTheme(system_theme + "-" + bgcolor);
      return;
    }
    setTheme(selectedTheme + "-" + bgcolor);
  }

  function handleTheme(value: string) {
    setTheme(mode + "-" + value);
  }

  const handleChangingProfileRules = (e: ChangeEvent<HTMLInputElement>) => {
    let name = e.target.name;
    let checked = e.target.checked;

    sendUserRuleChangeRequest({
      userId: user?.id!,
      rules: { [name]: { isVisible: checked } },
    });
  };

  const handleNotification = async (e: ChangeEvent<HTMLInputElement>) => {
    let name = e.target.name;
    let checked = e.target.checked;

    if (checked) {
      if (Notification.permission !== "granted")
        await Notification.requestPermission();

      if (Notification.permission === "denied") {
        setModal({ activeModal: "notificationBlockedAlert",open:true });
        return;
      }
    }

    setUserNotificationPref(name, checked);
  };

  useEffect(() => setBgcolor(theme?.split("-")[1] || themes[0]!), [theme, themes]);

  const checkBoxStyle =
    "checkbox checkbox-primary [--chkfg:oklch(var(--b3))] checkbox-sm";

  return (
    <div className="flex flex-col h-full">
      <Header title="General Settings" mainTab="settings" />
      <div className="flex flex-col max-sm:gap-8 gap-10 text-sm w-full overflow-y-scroll no-scrollbar py-4">
        <div className="grid gap-4 max-sm:px-0 px-4">
          <label className="text-sm text-primary" htmlFor="Theme">
            Manage Profile Visibility
          </label>
          <div className="form-control pl-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                name="profilePicture"
                onChange={handleChangingProfileRules}
                checked={Boolean(user?.rules?.profilePicture.isVisible)}
                type="checkbox"
                className={checkBoxStyle}
              />
              <span className="label-text">Profile Picture</span>
            </label>
          </div>
          <div className="form-control pl-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                name="lastSeen"
                onChange={handleChangingProfileRules}
                checked={Boolean(user?.rules?.lastSeen.isVisible)}
                type="checkbox"
                className={checkBoxStyle}
              />
              <span className="label-text">Last Seen</span>
            </label>
          </div>
          <div className="form-control pl-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                name="bio"
                onChange={handleChangingProfileRules}
                checked={Boolean(user?.rules?.bio.isVisible)}
                type="checkbox"
                className={checkBoxStyle}
              />
              <span className="label-text">About</span>
            </label>
          </div>
          <div className="form-control pl-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                name="readReceipts"
                onChange={handleChangingProfileRules}
                checked={Boolean(user?.rules?.readReceipts.isVisible)}
                type="checkbox"
                className={checkBoxStyle}
              />
              <span className="label-text">Read Receipts</span>
            </label>
          </div>
        </div>
        <div className="grid gap-4 max-sm:px-0 px-4">
          <label className="text-sm text-primary" htmlFor="Theme">
            Notifications
          </label>
          <div className="form-control pl-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                name="chatNotification"
                onChange={handleNotification}
                checked={Boolean(userNotificationPref?.chatNotification)}
                type="checkbox"
                className={checkBoxStyle}
              />
              <span className="label-text">Chat Notifications</span>
            </label>
          </div>
          <div className="form-control pl-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                name="groupNotification"
                onChange={handleNotification}
                checked={Boolean(userNotificationPref?.groupNotification)}
                type="checkbox"
                className={checkBoxStyle}
              />
              <span className="label-text">Group Notifications</span>
            </label>
          </div>
        </div>
        <div className="grid gap-4 max-sm:px-0 px-4">
          <label className="text-sm text-primary" htmlFor="Theme">
            Theme
          </label>
          <div className="flex gap-6 pl-2">
            <div className="form-control">
              <label className="label gap-4 justify-start cursor-pointer">
                <input
                  name="dark"
                  value="system"
                  checked={mode === "dark" || mode === "light"}
                  onChange={handleMode}
                  type="radio"
                  className="radio-primary radio radio-sm "
                  aria-label="Default"
                />
                <span className="label-text">Default</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label gap-4 justify-start cursor-pointer">
                <input
                  name="DARK"
                  value="DARK"
                  checked={mode === "DARK"}
                  onChange={handleMode}
                  type="radio"
                  className="radio-primary radio radio-sm "
                  aria-label="Dark"
                />
                <span className="label-text">Dark</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label gap-4 justify-start cursor-pointer">
                <input
                  name="LIGHT"
                  value="LIGHT"
                  checked={mode === "LIGHT"}
                  onChange={handleMode}
                  type="radio"
                  className="radio-primary radio radio-sm "
                  aria-label="Light"
                />
                <span className="label-text">Light</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-scroll no-scrollbar py-2 pl-2">
            {themes.map((color) => (
              <div
                key={color}
                onClick={() => handleTheme(color)}
                tabIndex={0}
                className={`flex flex-col gap-2 min-w-20 p-2 ${bgcolor === color ? `ring-2 ring-inset ` : ""} shadow-md cursor-pointer rounded-xl bg-gradient-to-t from-base-200`}
                style={{ "--tw-ring-color": "#" + color }}
              >
                <div
                  className={`w-4/5 h-4 ml-auto rounded-xl`}
                  style={{ backgroundColor: "#" + color }}
                />
                <div
                  className={`w-2/4 h-4 ml-auto rounded-xl`}
                  style={{ backgroundColor: "#" + color }}
                />
                <div className={`w-3/4 h-4 bg-base-100 rounded-xl`} />
                <div className={`w-3/4 h-4 bg-base-100 rounded-xl`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneralSettings;
