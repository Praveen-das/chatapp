import moment from "moment";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import Avatar from "../Avatar";
import { useStore } from "../../../store/global";
import { IGroupConversation } from "../../../interfaces/conversationInterface";
import { IModal } from "@interfaces/modalInterface";
import { useConversationStore } from "store/conversationStore";
import { useEffect, useState } from "react";
import axiosClient from "@lib/axiosClient";

export const JoinGroupModal = () => {
  const { user } = useAuth();
  const { sendGroupjoinRequest } = useSocket();
  const setModal = useStore(s=>s.setModal)
  const { invitationId } = useStore<IModal<{ invitationId: string }> | null>(
    (s) => s.modal
  )?.state!;
  const conversations = useConversationStore((s) => s.conversations);
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const [group, setGroup] = useState<IGroupConversation | null>(null);
  const [loading, setLoading] = useState(false);

  function handleJoiningGroup() {
    if (!group) return;
    sendGroupjoinRequest(
      group!,
      user!,
      conversations.some((c) => c.id === group.id)
    );
    setModal(null)
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await axiosClient<IGroupConversation[]>(`/group/fetch/${invitationId}`)
        .then((res) => {
          setLoading(false);
          const conversation = res.data[0]!;

          if (conversation) {
            if (conversation.members.find((m) => m.id === user?.id)) {
              const conversationId = useConversationStore
                .getState()
                .conversations.find(
                  (c) => c.conversationId === conversation.id
                )?.id!;

              setSelectedConversation(conversationId);
              setModal(null);
            } else {
              setGroup(conversation as IGroupConversation);
            }
          } else {
          }
        })
        .catch((res) => {
          setLoading(false);
          console.log(res);
        });
    })();
  }, [invitationId, user]);

  return (
    <div className="modal-box p-8 relative flex gap-2 items-center flex-col max-w-[450px] bg-[--modal]">
      {loading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : !group ? (
        <label htmlFor="">Group doesn't exist.</label>
      ) : (
        <>
          <Avatar
            url={group.profilePicture}
            size="120px"
            onlineIndication={false}
          />
          <label className="mt-4" htmlFor="">
            {group.displayName}
          </label>
          <label className="text-sm text-center text-white/20" htmlFor="">
            Created by {group.createdBy} on{" "}
            {moment(new Date(group.createdAt)).format("LT")}
          </label>
          <div className="avatar-group -space-x-4 rtl:space-x-reverse">
            {group.members.map((member, i) =>
              i > 4 ? null : (
                <div key={member.id} className="avatar border-base-300">
                  <div>
                    <Avatar
                      size="38px"
                      url={member.profilePicture}
                      onlineIndication={false}
                    />
                  </div>
                </div>
              )
            )}
            {group.members.length > 5 && (
              <div className="avatar border-base-300 placeholder">
                <div className="bg-base-200 text-neutral-content w-[38px]">
                  <span>+{group.members.length - 5}</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <div
              onClick={()=>setModal(null)}
              className="btn  btn-outline h-10 min-h-10 rounded-full"
            >
              Cancel
            </div>
            <div
              onClick={handleJoiningGroup}
              className="btn  btn-primary h-10 min-h-10 rounded-full"
            >
              Join Group
            </div>
          </div>
        </>
      )}
    </div>
  );
};
