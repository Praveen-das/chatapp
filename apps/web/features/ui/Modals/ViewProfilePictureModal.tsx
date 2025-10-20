import { useStore } from "../../../store/global";
import Image from "next/image";
import { downloadFromUrl } from "@lib/utils";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import Avatar from "@features/ui/Avatar";
import { IModal } from "@interfaces/modalInterface";
import FramerWrapper from "../MotionWrapper";

export const ViewProfilePictureModal = () => {
  const modal = useStore<IModal<{ displayName: string; url: string }> | null>((s) => s.modal);

  const { displayName, url } = modal?.state!;

  const handleDownload = () => downloadFromUrl(url);

  return (
    <FramerWrapper
      className={`modal-box w-full max-w-full h-full max-h-full m-auto overflow-hidden z-50 bg-[--modal] rounded-none px-0 pt-4`}
    >
      <div className="flex h-full items-center flex-col gap-4 overflow-hidden">
        {/* Header----------------- */}
        <div className="flex w-full justify-between gap-4 px-4">
          {/* Avatar and Username */}
          <div className="flex items-center gap-4">
            <Avatar url={url} onlineIndication={false} />
            <div className="grid gap-1">
              <label className="text-sm" htmlFor="username">
                {displayName}
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {url && (
              <div onClick={handleDownload} className="btn btn-circle btn-sm btn-ghost ml-auto">
                <ArrowDownTrayIcon className="size-5" />
              </div>
            )}
            <form method="dialog">
              <button className="btn btn-circle btn-sm btn-ghost ml-auto">
                <XMarkIcon className="size-5" />
              </button>
            </form>
          </div>
        </div>
        <div className="flex flex-col w-full h-full">
          <div className="w-full h-full relative flex justify-center items-center ">
            {url ? (
              <Image
                fill
                sizes="(max-width: 1024px) 100vw 180px"
                className="block h-full object-contain"
                src={url}
                alt="profile picture"
              />
            ) : (
              <div className="bg-[--avatarBg] h-2/4 aspect-square rounded-full flex justify-center items-center">
                <UserIcon className="size-2/4 duration-200" />
              </div>
            )}
          </div>
        </div>
      </div>
    </FramerWrapper>
  );
};
