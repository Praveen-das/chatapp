"use client";
import { useContext } from "react";
import { Context, IContext } from "../context/AuthContext";

type Selector<T> = (state: IContext) => T;

const useStore = (selector?: Selector<any>) => {
    const state = useContext(Context);
    if (!state) throw new Error(`Context not found`);

    if (selector) return selector(state)

    return state;
};

type IUseAuth = <T = IContext>(selector?: Selector<T>) => T | IContext

const useAuth: IUseAuth = (selector) => useStore(selector)

export default useAuth;
