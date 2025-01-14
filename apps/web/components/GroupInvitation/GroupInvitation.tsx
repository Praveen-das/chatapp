"use client";

import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import getLocalStorage from "../../lib/localStorage";
import { useStore } from "../../store/global";

function GroupInvitation() {
  const setModal = useStore((s) => s.setModal);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const invitationId = getLocalStorage()?.getItem("invitationId");

      if (invitationId) {
        setModal({
          activeModal: "joinGroupModal",
          state: {invitationId},
          open:true
        });
          
        getLocalStorage()?.removeItem("invitationId");
      }
    })();
  }, [user]);

  return null;
}

export default GroupInvitation;
