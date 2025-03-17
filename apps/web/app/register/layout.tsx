import { ReactNode } from "react";

async function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center items-center gap-8 w-full h-screen bg-base-300 text-base">
      {children}
    </div>
  );
}

export default Layout;
