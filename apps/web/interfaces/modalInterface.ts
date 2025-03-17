import modals from "@features/ui/modals";

export type IModal<T = any> = {
  activeModal: IModalKey;
  state?: T;
  open: boolean;
};

export type IModalKey = keyof typeof modals
