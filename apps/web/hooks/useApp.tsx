"use client";
import { useContext } from "react";
import { Context, IContext } from "../context/AppContext";

interface IUserAuth {
    (): IContext
    getState: () => Partial<IContext>
}

let store = {}

const useApp: IUserAuth = () => {
    const state = useContext(Context);
    if (!state) throw new Error(`Context not found`);
    store = state
    return state;
};

useApp.getState =()=> store

export default useApp;
