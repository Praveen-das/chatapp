"use client";
import { useContext } from "react";
import { Context, IContext } from "../context/AuthContext";

interface IUserAuth {
    (): IContext
    getState: () => Partial<IContext>
}

let store = {}

const useAuth: IUserAuth = () => {
    const state = useContext(Context);
    if (!state) throw new Error(`Context not found`);
    store = state
    return state;
};

useAuth.getState =()=> store

export default useAuth;
