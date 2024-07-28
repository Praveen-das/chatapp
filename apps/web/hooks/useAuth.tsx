"use client";
import { useContext } from "react";
import { Context, IContext } from "../context/AuthContext";

interface IUserAuth {
    (): IContext
    getState: () => Partial<IContext>
}

let stateStore = {}

const useAuth: IUserAuth = () => {
    const state = useContext(Context);
    if (!state) throw new Error(`Context not found`);
    stateStore = state
    
    return state;
};

useAuth.getState = () => stateStore

export default useAuth;
