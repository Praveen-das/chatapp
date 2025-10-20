import { Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { Types } from "mongoose";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage } from "@repo/interfaces/messageInterface";
import { GroupDeleteReq, JoinGroupParams, MemberReq } from "@repo/interfaces/groupInterface";
import { IGroupConversation } from "../interfaces/conversationInterfaces";
import { IGroupMember } from "@repo/interfaces/conversationInterface";

export default function registerGroupHandlers(io: Server, socket: ISocket) {
  socket.on("create group", async (groupConversations: IGroupConversation[]) => {
    if (!socket.userId) return;

    const sockets = io.sockets.sockets;

    groupConversations.forEach((conversation) => {
      sockets.forEach((_socket: ISocket) => {
        if (_socket.userId === conversation.userId) _socket.join(conversation.channelId!);
      });

      io.to(conversation.userId).emit("group created", conversation);
    });

    // produceMessage({ groupConversations }, "CREATE_GROUP_CONVERSATION");
  });

  socket.on(
    "updateGroupInfo",
    async ({
      conversation,
      updates,
      admin,
    }: {
      conversation: IGroupConversation;
      updates: Partial<IGroupConversation>;
      admin: IUser;
    }) => {
      const body = { groupId: conversation.conversationId, updates: updates };

      produceMessage(body, "UPDATE_GROUP_INFO");

      const updatedProperty = Object.keys(updates)[0]!;

      function getUpdateMessage(key: string) {
        switch (key) {
          case "displayName":
            return `${admin.username} changed group name to "${updates.displayName}"`;
          case "desc":
            return `${admin.username} modified the group description`;
          case "profilePicture":
            return `${admin.username} changed the profile picture`;
          default:
            break;
        }
      }

      const messageString = getUpdateMessage(updatedProperty);

      const message: Partial<IMessage> = {
        id: crypto.randomUUID(),
        conversationId: conversation.conversationId,
        from: "system",
        type: "notification",
        message: messageString,
        timestamp: Date.now(),
      };

      io.to(conversation.channelId!).emit("UPDATE_GROUP", { ...updates, id: conversation.conversationId }, message);
    }
  );

  socket.on("DELETE_GROUP_CONVERSATION", async (req: GroupDeleteReq) => {
    produceMessage(req, "DELETE_GROUP_CONVERSATION");
    io.to(socket.userId!).emit("DELETE_GROUP_CONVERSATION", req.conversationId);
    socket.leave(req.channelId);
  });

  socket.on("JOIN_GROUP", async ({ conversation, user, create }: JoinGroupParams) => {
    const conversationId = conversation.conversationId;

    if (create) produceMessage({ groupConversations: [conversation] }, "CREATE_GROUP_CONVERSATION");

    produceMessage({ members: [conversation.currentParticipation], groupId: conversationId }, "JOIN_GROUP");

    socket.join(conversation.channelId!);

    const userMessage: Partial<IMessage>[] = [
      {
        id: crypto.randomUUID(),
        conversationId,
        from: "system",
        type: "notification",
        message: `You joined the group`,
      },
    ];

    io.to(user.id).emit("JOIN_GROUP", conversation, userMessage, true);

    const broadcastMessage: Partial<IMessage>[] = [
      {
        id: crypto.randomUUID(),
        conversationId,
        from: "system",
        type: "notification",
        message: `${user.username} joined the group`,
      },
    ];

    io.to(conversation.channelId!)
      .except([user.id])
      .emit(
        "GROUP_ADD_MEMBERS",
        {
          conversationId,
          members: [{ ...user, memberId: conversation.currentParticipation?._id }],
        },
        broadcastMessage
      );
  });

  socket.on("LEAVE_GROUP", async ({ conversation, user }: { conversation: IGroupConversation; user: IUser }) => {
    const req = {
      userId: user.id,
      conversationId: conversation.conversationId,
      memberId: conversation.currentParticipation?._id,
    };

    produceMessage(req, "LEAVE_GROUP");

    socket.leave(conversation.channelId!);

    const broadcastMessage: Partial<IMessage>[] = [
      {
        id: crypto.randomUUID(),
        conversationId: conversation.conversationId,
        from: "system",
        type: "notification",
        message: `${user.username} left the group`,
      },
    ];

    const userMessage: Partial<IMessage>[] = [
      {
        id: crypto.randomUUID(),
        conversationId: conversation.conversationId,
        from: "system",
        type: "notification",
        message: `You left the group`,
      },
    ];

    io.to(conversation.channelId!)
      .except(socket.userId!)
      .emit("GROUP_REMOVE_MEMBER", { conversationId: conversation.conversationId, userId: user.id }, broadcastMessage);

    socket.emit("GROUP_REMOVE_MEMBER", { conversationId: conversation.conversationId, userId: user.id }, userMessage);
  });

  socket.on(
    "GROUP_ADD_MEMBERS",
    async ({
      conversation,
      members,
      admin,
    }: {
      conversation: IGroupConversation;
      members: IGroupMember[];
      admin: IUser;
    }) => {
      const groupConversations: IGroupConversation[] = [];
      const groupMembers: MemberReq[] = [];

      const _members = members.map(({ id }) => id);
      const sockets = io.sockets.sockets;
      const conversationId = conversation.conversationId;
      delete conversation._id;

      _members.forEach((id) => {
        sockets.forEach((_socket: ISocket) => {
          if (_socket.userId === id) _socket.join(conversation.channelId!);
        });
      });

      // message to new members ///////////////////////////////////////////////////////
      members = members.map((m) => {
        let memberId = new Types.ObjectId().toHexString();

        m.memberId = memberId;

        let member = {
          _id: memberId,
          conversationId,
          userId: m.id,
          joinedAt: Date.now(),
        };

        groupMembers.push(member);

        const receiverMessage = members.map((m) => ({
          id: crypto.randomUUID(),
          conversationId,
          from: "system",
          type: "notification",
          message: `${admin.username} added ${m.id === m.id ? "you" : m.username} to the group`,
        }));

        const groupConversation: IGroupConversation = {
          ...conversation,
          id: new Types.ObjectId().toHexString(),
          conversationId,
          userId: m.id,
          members: [...conversation.members, m],
          active: true,
          updatedAt: Date.now(),
          createdAt: Date.now(),
          currentParticipation: member,
        };

        groupConversations.push(groupConversation);

        io.to(m.id).emit("JOIN_GROUP", groupConversation, receiverMessage, false);

        return m;
      });

      // message to members//////////////////////////////
      const messages: Partial<IMessage>[] = members.map((m) => ({
        id: crypto.randomUUID(),
        conversationId,
        from: "system",
        type: "notification",
        message: `${admin.username} added ${m.username} to the group`,
      }));

      io.to(conversation.channelId!)
        .except([..._members, socket.userId!])
        .emit("GROUP_ADD_MEMBERS", { conversationId, members }, messages);

      // message to admin ///////////////////////////////////////////////////////
      const userMessages = members.map((m) => ({
        id: crypto.randomUUID(),
        conversationId,
        from: "system",
        type: "notification",
        message: `You added ${m.username} to the group`,
      }));

      socket.emit("GROUP_ADD_MEMBERS", { conversationId, members }, userMessages);

      const body = {
        groupId: conversationId,
        members: groupMembers,
      };

      produceMessage({ groupConversations }, "CREATE_GROUP_CONVERSATION");
      produceMessage(body, "JOIN_GROUP");
    }
  );

  socket.on(
    "GROUP_REMOVE_MEMBER",
    async ({
      conversation,
      user,
      memberId,
      admin,
    }: {
      conversation: IGroupConversation;
      user: IUser;
      memberId: string;
      admin: IUser;
    }) => {
      const req = {
        userId: user.id,
        conversationId: conversation.conversationId,
        memberId,
      };

      produceMessage(req, "LEAVE_GROUP");

      const broadcastMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          type: "notification",
          message: `${admin.username} removed ${user.username} from the group`,
        },
      ];

      io.to(conversation.channelId!)
        .except([user.id, socket.userId!])
        .emit(
          "GROUP_REMOVE_MEMBER",
          { conversationId: conversation.conversationId, userId: user.id },
          broadcastMessage
        );

      const adminMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          type: "notification",
          message: `You removed ${user.username} from the group`,
        },
      ];

      socket.emit(
        "GROUP_REMOVE_MEMBER",
        { conversationId: conversation.conversationId, userId: user.id },
        adminMessage
      );

      const userMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          type: "notification",
          message: `${admin.username} removed you from the group`,
        },
      ];

      io.to(user.id).emit(
        "GROUP_REMOVE_MEMBER",
        { conversationId: conversation.conversationId, userId: user.id },
        userMessage
      );

      const sockets = io.sockets.sockets;

      sockets.forEach((_socket: ISocket) => {
        if (_socket.userId === user.id) _socket.leave(conversation.channelId!);
      });
    }
  );

  type CUProps = { conversation: IGroupConversation; userId: string };

  socket.on("USER_MAKE_ADMIN", async ({ conversation, userId }: CUProps, callback: () => void) => {
    const body = { conversationId: conversation.conversationId, userId };

    produceMessage(body, "ADD_GROUP_ADMIN");

    callback();

    io.to(conversation.channelId!).emit("SET_GROUP_ADMIN", conversation.conversationId, userId, true);
  });

  socket.on(
    "USER_REMOVE_FROM_ADMIN",
    async ({ conversation, userId }: { conversation: IGroupConversation; userId: string }) => {
      const body = { conversationId: conversation.conversationId, userId };
      produceMessage(body, "REMOVE_GROUP_ADMIN");

      io.to(conversation.channelId!).emit("SET_GROUP_ADMIN", conversation.conversationId, userId, false);
    }
  );

  socket.on(
    "ADD_GROUP_TAG",
    async ({ conversation, tag, admin }: { conversation: IGroupConversation; tag: string; admin: IUser }) => {
      const body = { id: conversation.conversationId, tag };

      produceMessage(body, "ADD_GROUP_TAG");

      const broadcastMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          type: "notification",
          message: `${admin.username} added a new group tag "${tag}"`,
        },
      ];

      io.to(conversation.channelId!)
        .except(socket.userId!)
        .emit("ADD_GROUP_TAG", { groupId: conversation.conversationId, tag }, broadcastMessage);

      const adminMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          type: "notification",
          message: `You added a new group tag "${tag}"`,
        },
      ];

      socket.emit("ADD_GROUP_TAG", { groupId: conversation.conversationId, tag }, adminMessage);
    }
  );

  socket.on(
    "REMOVE_GROUP_TAG",
    async ({ conversation, tag, admin }: { conversation: IGroupConversation; tag: string; admin: IUser }) => {
      const body = { id: conversation.conversationId, tag };

      produceMessage(body, "REMOVE_GROUP_TAG");

      const broadcastMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          type: "notification",
          message: `${admin.username} removed the group tag "${tag}"`,
        },
      ];

      io.to(conversation.channelId!)
        .except(socket.userId!)
        .emit("REMOVE_GROUP_TAG", { groupId: conversation.conversationId, tag }, broadcastMessage);

      const adminMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          type: "notification",
          message: `You removed the group tag "${tag}"`,
        },
      ];

      socket.emit("REMOVE_GROUP_TAG", { groupId: conversation.conversationId, tag }, adminMessage);
    }
  );

  socket.on("REGISTER_CHANNELS", (channels: string[]) => {
    channels.forEach((channel) => {
      socket.join(channel);
    });
  });
}
