"use client";
import { useContext } from "react";
import { Context } from "context/AuthContext";

const useAuth = () => {
  const store = useContext(Context);
  if (!store) throw new Error("useAuth must be used within an AuthProvider");
  return store;
};

export default useAuth;
