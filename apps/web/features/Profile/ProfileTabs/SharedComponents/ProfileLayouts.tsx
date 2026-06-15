import { ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

interface ProfileHeaderProps {
  title: string;
  onBack: () => void;
}

export function ProfileHeader({ title, onBack }: ProfileHeaderProps) {
  return (
    <div className="min-h-16 w-full flex items-center gap-4 px-4 border-b border-base-content/5">
      <button
        onClick={onBack}
        className="btn btn-sm btn-ghost btn-circle text-base-content/70 hover:bg-base-content/10 transition-colors duration-150 pressable"
        aria-label="Go back"
      >
        <ChevronRightIcon className="size-5" />
      </button>
      <span className="font-semibold text-base text-base-content">{title}</span>
    </div>
  );
}

interface ProfileCardProps {
  title: string;
  children: ReactNode;
  variant?: "default" | "list";
}

export function ProfileCard({ title, children, variant = "default" }: ProfileCardProps) {
  const cardStyle =
    variant === "list"
      ? "bg-base-100/20 backdrop-blur-md rounded-2xl px-4 py-1 flex flex-col divide-y divide-base-content/5 shadow-xs [&>div]:h-16"
      : "bg-base-100/20 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-4 shadow-xs";

  return (
    <div className="flex flex-col gap-2 px-4">
      <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider pl-1">{title}</span>
      <div className={cardStyle}>{children}</div>
    </div>
  );
}
