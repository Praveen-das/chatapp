import { AddGroupMemberProps, IGroup } from "@interfaces/groupInterface";
import { getMemberById, getUserById, getUserFromMetadata } from "@lib/conversation";
import { ISocket } from "@lib/ws";
import { IGroupConversation, IGroupMember, IMember } from "@repo/interfaces/conversationInterface";
import {
  GroupClearReq,
  GroupDeleteReq,
  GroupLeftReq,
  JoinGroupParams,
} from "@repo/interfaces/groupInterface";
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

    removeMemberFromGroup: (conversation: IGroupConversation, member: IMember) => {
      const selectedUser = getUserFromMetadata(member);

      if (!selectedUser) return;
      if (!conversation) return;

      const req: GroupLeftReq = {
        conversation,
        user: selectedUser,
        memberId: member._id!,
        admin: user,
      };

      socket.emit("GROUP_REMOVE_MEMBER", { ...req, admin: user });
    },

    addMembersToGroup: (req: AddGroupMemberProps) => {
      socket.emit("GROUP_ADD_MEMBERS", req);
    },

    sendGroupjoinRequest: (req: JoinGroupParams) => {
      socket.emit("JOIN_GROUP", req);
    },

    leaveGroup: (req: GroupLeftReq) => {
      socket.emit("LEAVE_GROUP", req);
    },

    findGroupById: (conversationId: string) => {
      socket.emit("GROUP_FIND_BY_ID", conversationId);
    },

    sendGroupCreationRequest: (req: any, selectedGroupMembers: IUser[]) => {
      socket.emit("create group", req, selectedGroupMembers);
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
