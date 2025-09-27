import { APP_NAME } from "config/constants";
import React, { useEffect, useState } from "react";
import Logo from "public/favicon.svg";

function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MaxLoaded = generateRandomNumber(70, 90);

function LoadingPage({ isLoaded, onComplete }: { isLoaded: boolean; onComplete: (value: boolean) => void }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const time = setInterval(
      () => {
        setValue((s) => {
          const next = Math.min(s + Math.floor(Math.random() * 10), MaxLoaded);
          if (next >= MaxLoaded) clearInterval(time);
          return next;
        });
      },
      300 + Math.random() * 200
    );

    return () => clearInterval(time);
  }, []);

  return (
    <div className="fixed inset-0 z-[5000] w-full h-screen flex justify-center items-center">
      <div className="grid place-items-center gap-2 text-center">
        <Logo width={70} height={70} />
        <div className="text-xl ">{APP_NAME}</div>
        <div className="text-sm mt-2">Loading your chats {value !== 0 && `${isLoaded ? 100 : value}%`}</div>
        <div className="w-56 h-1 bg-slate-700 mt-2">
          <div
            onTransitionEnd={() => isLoaded && onComplete(true)}
            style={{ width: `${isLoaded ? 100 : value}%` }}
            className="h-full bg-slate-400 duration-500"
          />
        </div>
      </div>
    </div>
  );
}

export default LoadingPage;
