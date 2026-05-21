import { Server } from "socket.io";
import { produceMessage, createEnvelope, KAFKA_TOPICS } from "../kafka/kafka";
import { Types } from "mongoose";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage } from "@repo/interfaces/messageInterface";
import { GroupDeleteReq, GroupLeftReq, JoinGroupParams, MemberReq } from "@repo/interfaces/groupInterface";
import { IGroupConversation } from "../interfaces/conversationInterfaces";
import { AddGroupMemberProps, IGroup } from "../interfaces/groupInterface";

export default function registerGroupHandlers(io: Server, socket: ISocket) {
  socket.on("create group", async (groupConversations: IGroupConversation[], users: IUser[]) => {
    if (!socket.userId) return;

    const sockets = io.sockets.sockets;

    groupConversations.forEach((conversation) => {
      sockets.forEach((_socket: ISocket) => {
        if (_socket.userId === conversation.userId) _socket.join(conversation.channelId!);
      });

      io.to(conversation.userId).emit("group created", conversation, users, conversation.userId === socket.userId);
    });
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
      try {
        const body = { groupId: conversation.conversationId, updates };

        produceMessage(
          createEnvelope("UPDATE_GROUP_INFO", body),
          KAFKA_TOPICS.GROUPS,
          conversation.conversationId
        );

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
      } catch (error) {
        console.log("updateGroupInfo listener error:", error);
      }
    }
  );

  socket.on("DELETE_GROUP_CONVERSATION", async (req: GroupDeleteReq) => {
    produceMessage(
      createEnvelope("DELETE_GROUP_CONVERSATION", req),
      KAFKA_TOPICS.CONVERSATIONS,
      req.conversationId
    );
    io.to(socket.userId!).emit("DELETE_GROUP_CONVERSATION", req.conversationId);
    socket.leave(req.channelId);
  });

  socket.on("JOIN_GROUP", async ({ conversation, user, member, create, users }: JoinGroupParams) => {
    const conversationId = conversation.conversationId;

    if (create) {
      produceMessage(
        createEnvelope("CREATE_GROUP_CONVERSATION", { groupConversations: [conversation] }),
        KAFKA_TOPICS.CONVERSATIONS,
        conversationId
      );
    }

    produceMessage(
      createEnvelope("JOIN_GROUP", { members: [member], groupId: conversationId }),
      KAFKA_TOPICS.GROUPS,
      conversationId
    );

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

    io.to(user.id).emit("JOIN_GROUP", conversation, users, userMessage, true);

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
          members: [member],
          users: [user],
        },
        broadcastMessage
      );
  });

  socket.on("LEAVE_GROUP", async ({ conversation, memberId, user }: GroupLeftReq) => {
    const req = {
      userId: user.id,
      conversationId: conversation.conversationId,
      memberId,
    };

    produceMessage(
      createEnvelope("LEAVE_GROUP", req),
      KAFKA_TOPICS.GROUPS,
      conversation.conversationId
    );

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

  socket.on("GROUP_ADD_MEMBERS", async ({ group, existingUsers, selectedUsers, admin }: AddGroupMemberProps) => {
    const groupConversations: IGroupConversation[] = [];
    const conversationMembers: MemberReq[] = [];

    const to: string[] = [];
    const sockets = io.sockets.sockets;
    const conversationId = group.id;
    const users = [...existingUsers, ...selectedUsers];

    selectedUsers.forEach((member) => {
      sockets.forEach((_socket: ISocket) => {
        if (_socket.userId === member.id) _socket.join(group.channelId!);
      });

      to.push(member.id);

      conversationMembers.push({
        _id: new Types.ObjectId().toHexString(),
        conversationId,
        userId: member.id,
        joinedAt: Date.now(),
      });
    });

    selectedUsers.forEach((m) => {
      const receiverMessage = selectedUsers.map((m) => ({
        id: crypto.randomUUID(),
        conversationId,
        from: "system",
        type: "notification",
        message: `${admin.username} added ${m.id === m.id ? "you" : m.username} to the group`,
      }));

      const groupConversation: IGroupConversation = {
        ...group,
        id: new Types.ObjectId().toHexString(),
        conversationId,
        userId: m.id,
        members: [...group.members, ...conversationMembers],
        active: true,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };

      groupConversations.push(groupConversation);

      io.to(m.id).emit(
        "JOIN_GROUP",
        groupConversation,
        users.filter((u) => u.id !== m.id),
        receiverMessage,
        false
      );
    });

    // message to members//////////////////////////////
    const messages: Partial<IMessage>[] = selectedUsers.map((m) => ({
      id: crypto.randomUUID(),
      conversationId,
      from: "system",
      type: "notification",
      message: `${admin.username} added ${m.username} to the group`,
    }));

    io.to(group.channelId!)
      .except([...to, socket.userId!])
      .emit("GROUP_ADD_MEMBERS", { conversationId, members: conversationMembers, users: selectedUsers }, messages);

    // message to admin ///////////////////////////////////////////////////////
    const userMessages = selectedUsers.map((m) => ({
      id: crypto.randomUUID(),
      conversationId,
      from: "system",
      type: "notification",
      message: `You added ${m.username} to the group`,
    }));

    socket.emit(
      "GROUP_ADD_MEMBERS",
      { conversationId, members: conversationMembers, users: selectedUsers },
      userMessages
    );

    const body = {
      groupId: conversationId,
      members: conversationMembers,
    };

    produceMessage(
      createEnvelope("CREATE_GROUP_CONVERSATION", { groupConversations }),
      KAFKA_TOPICS.CONVERSATIONS,
      conversationId
    );
    produceMessage(
      createEnvelope("JOIN_GROUP", body),
      KAFKA_TOPICS.GROUPS,
      conversationId
    );
  });

  socket.on("GROUP_REMOVE_MEMBER", async ({ conversation, user, memberId, admin }: GroupLeftReq) => {
    const req = {
      userId: user.id,
      conversationId: conversation.conversationId,
      memberId,
    };

    produceMessage(
      createEnvelope("LEAVE_GROUP", req),
      KAFKA_TOPICS.GROUPS,
      conversation.conversationId
    );

    const broadcastMessage: Partial<IMessage>[] = [
      {
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        from: "system",
        type: "notification",
        message: `${admin?.username} removed ${user.username} from the group`,
      },
    ];

    io.to(conversation.channelId!)
      .except([user.id, socket.userId!])
      .emit("GROUP_REMOVE_MEMBER", { conversationId: conversation.conversationId, userId: user.id }, broadcastMessage);

    const adminMessage: Partial<IMessage>[] = [
      {
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        from: "system",
        type: "notification",
        message: `You removed ${user.username} from the group`,
      },
    ];

    socket.emit("GROUP_REMOVE_MEMBER", { conversationId: conversation.conversationId, userId: user.id }, adminMessage);

    const userMessage: Partial<IMessage>[] = [
      {
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        from: "system",
        type: "notification",
        message: `${admin?.username} removed you from the group`,
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
  });

  type CUProps = { conversation: IGroupConversation; userId: string };

  socket.on("USER_MAKE_ADMIN", async ({ conversation, userId }: CUProps, callback: () => void) => {
    const body = { conversationId: conversation.conversationId, userId };

    produceMessage(
      createEnvelope("ADD_GROUP_ADMIN", body),
      KAFKA_TOPICS.GROUPS,
      conversation.conversationId
    );

    callback();

    io.to(conversation.channelId!).emit("SET_GROUP_ADMIN", conversation.conversationId, userId, true);
  });

  socket.on(
    "USER_REMOVE_FROM_ADMIN",
    async ({ conversation, userId }: { conversation: IGroupConversation; userId: string }) => {
      const body = { conversationId: conversation.conversationId, userId };
      produceMessage(
        createEnvelope("REMOVE_GROUP_ADMIN", body),
        KAFKA_TOPICS.GROUPS,
        conversation.conversationId
      );

      io.to(conversation.channelId!).emit("SET_GROUP_ADMIN", conversation.conversationId, userId, false);
    }
  );

  socket.on(
    "ADD_GROUP_TAG",
    async ({ conversation, tag, admin }: { conversation: IGroupConversation; tag: string; admin: IUser }) => {
      const body = { id: conversation.conversationId, tag };

      produceMessage(
        createEnvelope("ADD_GROUP_TAG", body),
        KAFKA_TOPICS.GROUPS,
        conversation.conversationId
      );

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

      produceMessage(
        createEnvelope("REMOVE_GROUP_TAG", body),
        KAFKA_TOPICS.GROUPS,
        conversation.conversationId
      );

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
