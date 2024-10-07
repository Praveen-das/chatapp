'use client'

import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { IGroupConversation } from "../../interfaces/conversationInterface";
import axiosClient from "../../lib/axiosClient";
import getLocalStorage from "../../lib/localStorage";
import { useConversationStore } from "../../store/conversationStore";
import { useStore } from "../../store/global";

function GroupInvitation() {
  const setModal = useStore((s) => s.setModal);
  const { user } = useAuth();
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );

  useEffect(() => {
    (async () => {
      const invitationId = getLocalStorage()?.getItem("invitationId");
      
      if (invitationId) {
        await axiosClient<IGroupConversation[]>(`/group/fetch/${invitationId}`)
          .then((res) => {
            const conversation = res.data[0];
            
            if (conversation) {
              if (conversation.members.find((m) => m.id === user?.id))
                setSelectedConversation(conversation.id);
              else {
                setModal({
                  activeModal: "joinGroupModal",
                  state: conversation,
                });
                document
                  .querySelector<HTMLDialogElement>("#action-modal")
                  ?.showModal();
              }
            } else {
              setModal({ activeModal: "joinGroupModal", state: null });
              document
                .querySelector<HTMLDialogElement>("#action-modal")
                ?.showModal();
            }
          })
          .catch((res) => {
            console.log(res);
          });
        getLocalStorage()?.removeItem("invitationId");
      }
    })();
  }, [user]);

  return null
}

export default GroupInvitation;
