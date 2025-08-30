import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../store/global";
import Cropper from "cropperjs";

import "./style.css";
import { XCircleIcon } from "@heroicons/react/24/solid";
import useAuth from "@hooks/useAuth";
import useMediaQuery from "@hooks/useMediaQuery";
import { IModal } from "@interfaces/modalInterface";
import FramerWrapper from "../MotionWrapper";

const closeModal = () => {
  useStore.getState().setModal(false);
};

export const UploadProfilePictureModal = () => {
  const { user } = useAuth();
  const modal = useStore<IModal<{
    file: File;
    callback: (base64: string) => void;
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
    modal?.state?.callback(src);
    closeModal();
  }

  const isMobile = useMediaQuery("(max-width:640px)");
  const [size, setSize] = useState(0);

  useEffect(() => {
    if (!isMobile) return;
    setSize(window.innerWidth);
    window.onresize = () => {
      setSize(window.innerWidth);
    };
  }, [isMobile]);

  return (
    <FramerWrapper
      className={`modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 max-sm:w-full max-sm:h-full px-0 py-6 relative flex flex-col items-center max-w-full max-h-full w-auto gap-4 bg-[--modal]`}
    >
      {/* Header----------------- */}
      <div className="flex px-6 justify-between items-center w-full">
        <h3 className="font-medium text-lg">Upload</h3>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
          <XCircleIcon className="size-6" />
          </button>
        </form>
      </div>

      <div
        className="block my-auto max-w-[450px] max-h-[450px] sm:w-[450px] sm:h-[450px]"
        style={isMobile?{ width: `${size}px`, height: `${size}px` }:{}}
      >
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
        className="absolute bottom-6 right-6 btn btn-circle btn-primary text-[--black-white] grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
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
    </FramerWrapper>
  );
};
