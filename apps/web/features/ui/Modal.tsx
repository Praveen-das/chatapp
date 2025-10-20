"use client";
import { useEffect, useRef } from "react";
import { useStore } from "../../store/global";
import modals from "./modals";
import { IModalKey } from "@interfaces/modalInterface";
import { AnimatePresence } from "framer-motion";

const Modal = () => {
  const modal = useStore((s) => s.modal);
  const setModal = useStore((s) => s.setModal);

  function handleClose() {
    if (modal) setModal({ ...modal, open: false });
  }

  return (
    <dialog onClose={handleClose} open={Boolean(modal?.open)} className="modal outline-none">
      <AnimatePresence onExitComplete={() => setModal(null)}>
        {Boolean(modal?.open) ? modals[modal?.activeModal as IModalKey] : null}
      </AnimatePresence>
      <form method="dialog" className="modal-backdrop bg-black/40 !transform-none">
        <button className="max-sm:hidden outline-none">close</button>
      </form>
    </dialog>
  );
};

export default Modal;
