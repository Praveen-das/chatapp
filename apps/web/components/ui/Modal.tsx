"use client";
import { useMessageStore } from "../../store/messageStore";
import { useStore } from "../../store/global";
import modals from './modals'
import { IModalKey } from "@interfaces/modalInterface";

const Modal = () => {
  const modal = useStore((s) => s.modal);
  const setModal = useStore((s) => s.setModal);
  
  function handleClose() {
    setModal(null);
  }

  return (
    <dialog
      onClose={handleClose}
      open={Boolean(modal?.open)}
      id="action-modal"
      className="modal outline-none"
    >
      {modals[modal?.activeModal as IModalKey]}
      <form method="dialog" className="modal-backdrop bg-black/40">
        <button className="max-sm:hidden outline-none">close</button>
      </form>
    </dialog>
  );
};

export default Modal;
