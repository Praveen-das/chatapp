import React from "react";

function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-center px-4 my-2 pointer-events-none">
      <label className="py-1 px-2 w-max text-xs bg-base-300 rounded-2xl text-center">
        {text}
      </label>
    </div>
  );
}

export default SystemMessage;
