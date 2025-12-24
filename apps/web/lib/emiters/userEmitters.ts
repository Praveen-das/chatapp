import { IUserConversation } from "@interfaces/conversationInterface";
import { getReceiverMetadata, getActiveUsers } from "@lib/conversation";
import { ISocket } from "@lib/ws";
import otp_socket from "@lib/ws_otp";
import { IUserBlockRequest } from "@repo/interfaces/conversationInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import { IUser, IUserRuleChangeRequest } from "@repo/interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";

export function userEmitters(socket: ISocket, user: IUser) {
  return {
    getUserStatus: (userId: string, callback: (data: any) => void) => {
      socket.emit("GET_USER_STATUS", { userId }, callback);
    },

    sendPresence: (to: Array<string>) => {
      socket.emit("USER_CONNECTED", to);
    },

    sendOTPVerificationRequest: (userId: string) => {
      otp_socket.auth = { OTP_REQUEST: true };
      otp_socket.connect();
      otp_socket.emit("OTP_REQUEST", { userId }, () => {
        otp_socket.disconnect();
      });
    },

    sendRequestToEndSession: (sessionIds: string[]) => {
      socket.emit("END_SESSION", sessionIds);
    },

    sendUserBlockRequest: (conversation: IUserConversation) => {
      const blockedUser = getReceiverMetadata(conversation!);

      const req: IUserBlockRequest = {
        conversationId: conversation.conversationId,
        blocked: true,
        blockedId: blockedUser?.userId!,
      };

      socket.emit("UPDATE_USER_BLOCK_STATUS", req);
    },

    sendUserUnBlockRequest: (conversation: IUserConversation) => {
      const blockedUser = getReceiverMetadata(conversation!)!;

      const req: IUserBlockRequest = {
        conversationId: conversation.conversationId,
        blocked: false,
        blockedId: blockedUser.userId,
      };

      socket.emit("UPDATE_USER_BLOCK_STATUS", req);
    },

    updateUserInfo: (req: { userId: string; updates: Partial<IUser> }) => {
      socket.emit("UPDATE_USER", req);
    },

    sendUserRuleChangeRequest: (req: IUserRuleChangeRequest) => {
      const sockets = getSocketChannels();

      socket.emit(
        "UPDATE_USER_RULE",
        req,
        sockets
        //     , ({ userId, rule }: IUserRuleChangeRequest) => {
        //     if (userId === user.id) {
        //       const hasRule = user.rules?.includes(rule);
        //       let newRules = hasRule ? user.rules?.filter((r) => r !== rule)! : [...(user.rules || []), rule];

        //       const update = { ...user, rules: newRules, updatedAt: Date.now() } as IUser;
        //       updateSession(update);
        //       return;
        //     }
        //   }
      );
    },
  };
}

function getSocketChannels() {
  const users = getActiveUsers().map((u) => u.id);
  const groupMembers = useConversationStore.getState().conversations.reduce<Set<string>>((i, c) => {
    if (c?.host === "user" || c?.host === "group") c.members.forEach((m) => i.add(m.userId));
    return i;
  }, new Set());

  return [...new Set([...users, ...groupMembers])];
}
