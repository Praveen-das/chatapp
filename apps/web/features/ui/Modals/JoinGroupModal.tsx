import moment from "moment";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import Avatar from "../Avatar";
import { useStore } from "../../../store/global";
import { useConversationStore } from "store/conversationStore";
import { useEffect, useState } from "react";
import useAxios from "@hooks/useAxios";
import { IModal } from "@interfaces/modalInterface";
import { IGroup } from "@interfaces/groupInterface";
import FramerWrapper from "../MotionWrapper";
import ObjectID from "bson-objectid";
import { getMemberById, getUserFromMetadata } from "@lib/conversation";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";

export const JoinGroupModal = () => {
  const axios = useAxios();
  const { user } = useAuth();
  const { sendGroupjoinRequest } = useSocket();
  const setModal = useStore((s) => s.setModal);
  const { invitationId } = useStore<IModal<{ invitationId: string }> | null>((s) => s.modal)?.state!;
  const conversations = useConversationStore((s) => s.conversations);
  const { setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const [group, setGroup] = useState<(IGroup & { users: IUser[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  function handleJoiningGroup() {
    if (!group) return;
    if (!user) return;

    let groupConversation: any = {};
    const userId = user.id;
    const memberId = new ObjectID().toHexString();

    const member = {
      _id: memberId,
      conversationId: group.id,
      userId,
      joinedAt: Date.now(),
    };

    delete group._id;

    const existingConversation = conversations.find((c) => c.conversationId === group.id);

    const members = [...group.members, member];

    if (!existingConversation) {
      groupConversation = {
        ...group,
        id: new ObjectID().toHexString(),
        conversationId: group.id,
        userId,
        members,
        active: true,
        joinedAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      groupConversation = { ...existingConversation, members };
    }

    sendGroupjoinRequest({
      conversation: groupConversation!,
      member,
      user,
      users:group.users,
      create: !existingConversation,
    });

    setModal(false);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const fetchedGroup = await axios<IGroup[]>(`/db/group/group-invitations/${invitationId}`).then(
          (res) => res.data[0]
        );
        
        if (fetchedGroup) {
          if (getMemberById(fetchedGroup as IGroupConversation, user?.id!)) {
            const conversationId = useConversationStore
              .getState()
              .conversations.find((c) => c.conversationId === fetchedGroup.id)?.id!;

            setSelectedConversation(conversationId);
            setModal(false);
          } else {
            setGroup(fetchedGroup as any);
          }
        } else {
          setGroup(null);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [invitationId, user]);

  return (
    <FramerWrapper
      className={`modal-box p-8 py-10 relative flex gap-2 items-center flex-col max-w-[400px] bg-[--modal]`}
    >
      {loading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : !group ? (
        <label htmlFor="">Group doesn't exist.</label>
      ) : (
        <>
          <Avatar url={group.profilePicture} size="150px" onlineIndication={false} />
          <label className="mt-4 text-lg" htmlFor="">
            {group.displayName}
          </label>
          <label className="text-sm text-center text-base-content" htmlFor="">
            Created by {group.createdBy} on{" "}
            <span className="whitespace-nowrap">{moment(new Date(group.createdAt!)).format("LT")}</span>
          </label>
          <div className="avatar-group -space-x-4 rtl:space-x-reverse">
            {group.users.map((member: any, i) => {
              // let member = getUserFromMetadata(meta);
              if (!member) return null;
              return i > 4 ? null : (
                <div key={member.id} className="avatar rounded-full bg-base-200 border-base-200">
                  <div>
                    <Avatar
                      size="38px"
                      url={member.profilePicture}
                      profileHidden={member.rules.includes("hide_profilepicture")}
                      onlineIndication={false}
                    />
                  </div>
                </div>
              );
            })}
            {group.members.length > 5 && (
              <div className="avatar border-base-300 placeholder">
                <div className="bg-base-200 text-neutral-content w-[38px]">
                  <span>+{group.members.length - 5}</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <div onClick={() => setModal(false)} className="btn [--b2:--b1] h-10 min-h-10 rounded-full">
              Cancel
            </div>
            <div
              onClick={handleJoiningGroup}
              className="btn  btn-primary text-[--black-white] h-10 min-h-10 rounded-full"
            >
              Join Group
            </div>
          </div>
        </>
      )}
    </FramerWrapper>
  );
};
