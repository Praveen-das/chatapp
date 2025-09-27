"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import getLocalStorage from "@lib/localStorage";

function page({ params: { invitationId } }: { params: { invitationId: string } }) {
  const router = useRouter();

  useEffect(() => {
    if (invitationId) getLocalStorage()?.setItem("invitationId", invitationId);
    router.replace("/");
  }, [invitationId]);

  return null;
}

export default page;
