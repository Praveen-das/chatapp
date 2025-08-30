import React, { PropsWithChildren } from "react";

function ModalTitle({ children }: PropsWithChildren) {
  return <h3 className="max-sm:px-4 px-6 mb-2 font-medium text-lg">{children}</h3>;
}

export default ModalTitle;
