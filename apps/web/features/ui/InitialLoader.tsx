import { APP_NAME } from "config/constants";
import React from "react";
import Logo from 'public/favicon.svg'

function LoadingPage() {
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="grid place-items-center gap-2 text-center">
        <Logo width={50} height={50}/>
        <div className="text-sm">{APP_NAME}</div>
        <span className="loading loading-spinner loading-lg mt-4"></span>
      </div>
    </div>
  ); 
}

export default LoadingPage;
