import { create } from "zustand";

export interface IMenu<T = any, K = any> {
  id: string | number;
  data?: T;
  reference?: K;
  position?: {x:number,y:number};
}

interface IMenuContext {
  menu: IMenu | null;
  setMenu: (menu: IMenu | null) => void;
}

export const useMenu = create<IMenuContext>((set, get) => {
  return {
    menu: null,
    setMenu: (menu) => set({ menu }),
  };
});
