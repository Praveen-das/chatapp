import { useStore } from "../../../store/global";
import Image from "next/image";
import { downloadFromUrl } from "@lib/utils";
import { UserIcon } from "@heroicons/react/24/solid";
import Avatar from "@components/ui/Avatar";
import { IModal } from "@interfaces/modalInterface";

export const ViewProfilePictureModal = () => {
  const modal = useStore<IModal<{ displayName: string; url: string }> | null>(
    (s) => s.modal
  );

  const { displayName, url } = modal?.state!;

  const handleDownload = () => downloadFromUrl(url);

  return (
    <div
      // variants={container}
      // initial="hidden"
      // animate="visible"
      // exit="hidden"
      className="fixed modal-box inset-0 flex justify-center items-center flex-col gap-2 w-full max-w-full h-full max-h-full rounded-none bg-base-200 overflow-hidden p-4 z-50"
    >
      {/* Header----------------- */}
      <div className="flex w-full justify-between gap-2">
        <div className="flex items-center gap-4  px-4">
          <Avatar url={url} onlineIndication={false} size="48px" />
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="username">
              {displayName}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            onClick={handleDownload}
            className="btn btn-circle btn-ghost ml-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>
          <form method="dialog">
            <button className="btn btn-circle btn-ghost ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
      
      {url ? (
        <Image
          width={500}
          height={500}
          className="block h-full object-contain mb-4"
          src={url}
          alt="profile picture"
        />
      ) : (
        <UserIcon />
      )}
    </div>
  );
};
