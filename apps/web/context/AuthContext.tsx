"use client";

import React, { createContext, useEffect, useRef, useState } from "react";
import { IUser } from "../interfaces/userInterface";
import ObjectID from "bson-objectid";
import axiosClient from "@lib/axiosClient";
import axios from "axios";

export type IContext = ReturnType<typeof useContextData>;

export const Context = createContext<IContext | null>(null);

const useContextData = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const userRef = useRef<IUser | null>(null);

  useEffect(() => {
    (async () => {
      const _user = await getUser();

      userRef.current = _user;
      setUser(_user);
    })();

    return () => {
      setUser(null);
    };
  }, []);

  const getUser = async () => {
    const _user: string | null = sessionStorage.getItem("user");

    let currentUser: IUser = _user && JSON.parse(_user);

    if (!_user) {
      currentUser = await axios.post("api/user").then((res) => res.data);
      
      sessionStorage.setItem("user", JSON.stringify(currentUser));
    }

    return currentUser;
  };

  const updateUser = async(key: string, value: any) => {
    const updatedUser = await axiosClient.put(`/user/${userRef.current?.id}`,{[key]:value}).then((res) => res.data);
    
    setUser({...updatedUser});
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return {
    user,
    updateUser,
  };
};

export default function AuthContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useContextData();
  return <Context.Provider value={value}>{value.user && children}</Context.Provider>;
}
