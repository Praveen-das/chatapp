import { useEffect, useMemo, useRef } from "react";
import { useStore } from "../../../store/global";
import Cropper from "cropperjs";

import "./style.css";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { CheckIcon } from "@heroicons/react/16/solid";
import useAuth from "@hooks/useAuth";
import { IModal } from "@interfaces/modalInterface";

const closeModal = () => {
  document.querySelector<HTMLDialogElement>("#action-modal")?.close();
  useStore.getState().setModal(null)
};

export const UploadProfilePictureModal = () => {
  const modal = useStore<IModal<{
    file: File;
    callback: (key: string, value: string) => void;
  }> | null>((s) => s.modal);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropper = useRef<Cropper | null>(null);

  const img = useMemo(
    () => URL.createObjectURL(modal?.state?.file!),
    [modal?.state?.file]
  );

  useEffect(() => {
    if (!imageRef.current) return;
    imageRef.current.onload = (e) => {
      cropper.current = new Cropper(imageRef.current!, {
        aspectRatio: 1,
        viewMode: 3,
        dragMode: "move",
        autoCropArea: 1,
        restore: false,
        modal: true,
        guides: true,
        highlight: false,
        cropBoxMovable: false,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false,
      });
    };
  }, []);

  function cropImage() {
    if (!cropper.current) return;
    let canvas = cropper.current.getCroppedCanvas({
      width: 300,
      height: 300,
    });

    let src = canvas.toDataURL();
    modal?.state?.callback("profilePicture", src);
    closeModal()
  }

  return (
    <div
      // variants={container}
      // initial="hidden"
      // animate="visible"
      // exit="hidden"
      className="modal-box px-0 py-6 relative flex flex-col items-center max-w-full max-h-full w-auto gap-4 bg-[--modal]"
    >
      {/* Header----------------- */}
      <div className="flex px-6 justify-between items-center w-full">
        <h3 className="font-medium text-lg">Upload</h3>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
      <div className="w-[450px] h-[450px] block">
        <img
          ref={imageRef}
          className="block max-w-full"
          src={img}
          alt="profile picture"
        />
      </div>
      <div
        onClick={cropImage}
        tabIndex={0}
        className="absolute bottom-6 right-6 btn btn-circle btn-primary text-white grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="size-6"
        >
          <path
            fillRule="evenodd"
            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};
