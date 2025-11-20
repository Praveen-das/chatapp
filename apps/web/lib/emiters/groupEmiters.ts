import { IGroup } from "@interfaces/groupInterface";
import { getMemberById, getUserById } from "@lib/conversation";
import { ISocket } from "@lib/ws";
import { IGroupConversation, IGroupMember } from "@repo/interfaces/conversationInterface";
import { GroupClearReq, GroupDeleteReq, JoinGroupParams } from "@repo/interfaces/groupInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { toast } from "react-toastify";

export function initGroupEmitters(socket: ISocket, user: IUser) {
  return {
    addGroupTag: (req: { conversation: IGroupConversation; tag: string }) => {
      socket.emit("ADD_GROUP_TAG", { ...req, admin: user });
    },

    removeGroupTag: (req: { conversation: IGroupConversation; tag: string }) => {
      socket.emit("REMOVE_GROUP_TAG", { ...req, admin: user });
    },

    sendRequestToClearGroupConversation: (req: GroupClearReq) => {
      socket.emit("CLEAR_GROUP_CONVERSATION", req);
    },

    sendGroupConversationDeleteRequest: (req: GroupDeleteReq) => {
      socket.emit("DELETE_GROUP_CONVERSATION", req);
    },

    makeAdmin: (conversation: IGroupConversation, userId: string) => {
      const selectedUser = getMemberById(conversation, userId);
      socket.emit("USER_MAKE_ADMIN", { conversation, userId }, (res: any) => {
        toast.success(`${getUserById(selectedUser?.userId!)?.username} is now an admin`);
      });
    },

    removeFromAdmin: (conversation: IGroupConversation, userId: string) => {
      socket.emit("USER_REMOVE_FROM_ADMIN", { conversation, userId });
    },

    removeMemberFromGroup: (conversation: IGroupConversation, user: IGroupMember, memberId?: string) => {
      socket.emit("GROUP_REMOVE_MEMBER", {
        conversation,
        user,
        memberId,
        admin: user,
      });
    },

    addMembersToGroup: (group: Partial<IGroup>, members: IUser[]) => {
      // const member = selectedUsers.map(u=>({
      //   _id: new ObjectID().toHexString(),
      //   conversationId: group.id,
      //   userId: user!.id,
      //   joinedAt: Date.now(),
      // }));

      socket.emit("GROUP_ADD_MEMBERS", {
        group,
        members,
        admin: user,
      });
    },

    sendGroupjoinRequest: ({ conversation, user, create = false }: JoinGroupParams) => {
      socket.emit("JOIN_GROUP", { conversation, user, create });
    },

    leaveGroup: (conversation: IGroupConversation, user: IUser) => {
      socket.emit("LEAVE_GROUP", { conversation, user });
    },

    findGroupById: (conversationId: string) => {
      socket.emit("GROUP_FIND_BY_ID", conversationId);
    },

    sendGroupCreationRequest: (req: any, selectedGroupMembers: IUser[]) => {
      socket.emit("create group", req, selectedGroupMembers, (data: any) => {
        console.log(data);
      });
    },

    sendGroupInfoUpdateRequest: (conversation: IGroupConversation, updates: Partial<IGroupConversation>) => {
      socket.emit("updateGroupInfo", {
        conversation,
        updates: { ...updates, updatedAt: Date.now() },
        admin: user,
      });
    },
  };
}
