import { browserIcons } from "config/browserIcons";
import React from "react";


function BrowserAvatar({
  browser,
  className = "",
}: {
  browser:  keyof typeof browserIcons;
  className?: string;
}) {
  return (
    <div className={`rounded-full ${className}`}>
      <img src={browserIcons[browser]} className="size-full" width={32} height={32} alt="chrome" />
    </div>
  );
}

export default BrowserAvatar;
