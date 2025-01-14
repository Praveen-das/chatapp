import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { createChatGroup } from "../services/groupServices";
import axiosClient from "../lib/axiosClient";
import produceMessage from "../kafka/kafka";
import { Types } from "mongoose";

function getUpdatedValues(obj: IGroupConversation, key: string) {
  const value = { [key]: obj[key as keyof typeof obj] };
  return { id: obj.id, ...value };
}

export default function registerGroupHandlers(io: Server, socket: ISocket) {
  socket.on("create group", async (group: IGroup) => {
    if (!socket.userId) return;

    const sockets = io.sockets.sockets;
    const groupConversations: IGroupConversation[] = [];

    group.members.forEach((member) => {
      const userConversation: IGroupConversation = {
        ...group,
        id: new Types.ObjectId().toHexString(),
        conversationId: group.id,
        userId: member.id,
        active: true,
        joinedAt: Date.now(),
      };

      sockets.forEach((_socket: ISocket) => {
        if (_socket.userId === member.id) _socket.join(group.channelId!);
      });

      groupConversations.push(userConversation);

      io.to(member.id).emit("group created", userConversation);
    });

    produceMessage({ group }, "CREATE_GROUP");
    produceMessage({ groupConversations }, "CREATE_GROUP_CONVERSATION");
  });

  socket.on(
    "updateGroupInfo",
    async ({
      conversation,
      updates,
    }: {
      conversation: IGroupConversation;
      updates: Partial<IGroupConversation>;
    }) => {
      const body = { groupId: conversation.conversationId, updates: updates };
      const newConversation = await axiosClient
        .patch(`/group/update`, body)
        .then((res) => res.data[0])
        .catch((res) => res);

      const updatedProperty = Object.keys(updates)[0];

      function getUpdateMessage(key: string) {
        switch (key) {
          case "displayName":
            return `${socket.username} changed group name to "${updates.displayName}"`;
          case "desc":
            return `${socket.username} modified the group description`;
          case "profilePicture":
            return `${socket.username} changed the profile picture`;
          default:
            break;
        }
      }

      const messageString = getUpdateMessage(updatedProperty);

      const message: Partial<IMessage> = {
        id: crypto.randomUUID(),
        conversationId: conversation.conversationId,
        from: "system",
        message: messageString,
        timestamp: Date.now(),
      };

      const updatedConversation = getUpdatedValues(
        newConversation,
        updatedProperty
      );

      io.to(conversation.channelId!).emit(
        "UPDATE_GROUP",
        updatedConversation,
        message
      );
    }
  );

  socket.on(
    "JOIN_GROUP",
    async ({
      conversation,
      user,
      conversationExist,
    }: {
      conversation: IGroupConversation;
      user: IUser;
      conversationExist: boolean;
    }) => {
      let groupConversation: IGroupConversation | null = null;
      delete conversation._id;

      if (!conversationExist) {
        groupConversation = {
          ...conversation,
          id: new Types.ObjectId().toHexString(),
          conversationId: conversation.id,
          userId: socket.userId!,
          members: [...conversation.members, user],
          active: true,
          joinedAt: Date.now(),
          updatedAt: Date.now(),
        };

        produceMessage(
          { groupConversations: [groupConversation] },
          "CREATE_GROUP_CONVERSATION"
        );
      }

      const body = {
        conversationId: conversation.id,
        members: [user.id],
      };

      produceMessage(body, "JOIN_GROUP");

      socket.join(conversation.channelId!);

      const broadcastMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          message: `${user.username} joined the group`,
        },
      ];

      const userMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          message: `You joined the group`,
        },
      ];

      socket.emit(
        "GROUP_ADD_MEMBERS",
        {
          conversation: !conversationExist ? groupConversation : undefined,
          conversationId: conversation.id,
          members: [user],
        },
        userMessage
      );

      io.to(conversation.channelId!)
        .except(user.id)
        .emit(
          "GROUP_ADD_MEMBERS",
          { conversationId: conversation.id, members: [user] },
          broadcastMessage
        );
    }
  );

  socket.on(
    "LEAVE_GROUP",
    async ({
      conversation,
      user,
    }: {
      conversation: IGroupConversation;
      user: IUser;
    }) => {
      const req = {
        userId: user.id,
        conversationId: conversation.conversationId,
      };

      produceMessage(req, "LEAVE_GROUP");

      const broadcastMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.conversationId,
          from: "system",
          message: `${user.username} left the group`,
        },
      ];
      
      const userMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.conversationId,
          from: "system",
          message: `You left the group`,
        },
      ];

      io.to(conversation.channelId!)
        .except(socket.userId!)
        .emit(
          "GROUP_REMOVE_MEMBER",
          { conversationId: conversation.conversationId, userId: user.id },
          broadcastMessage
        );

      socket.emit(
        "GROUP_REMOVE_MEMBER",
        { conversationId: conversation.conversationId, userId: user.id },
        userMessage
      );
    }
  );

  socket.on("DELETE_GROUP_CONVERSATION", async (conversation: IGroupConversation) => {
    produceMessage(conversation.id, "DELETE_GROUP_CONVERSATION");
    socket.leave(conversation.channelId!);
  });

  socket.on(
    "GROUP_ADD_MEMBERS",
    async ({
      conversation,
      members,
    }: {
      conversation: IGroupConversation;
      members: IUser[];
    }) => {
      const _members = members.map(({ id }) => id);

      const sockets = io.sockets.sockets;

      _members.forEach((id) => {
        sockets.forEach((_socket: ISocket) => {
          if (_socket.userId === id) _socket.join(conversation.channelId!);
        });
      });

      // message to members//////////////////////////////
      const messages = members.map((m) => ({
        id: crypto.randomUUID(),
        conversationId: conversation.conversationId,
        from: "system",
        message: `${socket.username} added ${m.username} to the group`,
      }));

      io.to(conversation.channelId!)
        .except([..._members, socket.userId!])
        .emit(
          "GROUP_ADD_MEMBERS",
          { conversationId: conversation.conversationId, members },
          messages
        );

      // message to user ///////////////////////////////////////////////////////
      const userMessages = members.map((m) => ({
        id: crypto.randomUUID(),
        conversationId: conversation.conversationId,
        from: "system",
        message: `You added ${m.username} to the group`,
      }));

      socket.emit(
        "GROUP_ADD_MEMBERS",
        { conversationId: conversation.conversationId, members },
        userMessages
      );

      // message to new members ///////////////////////////////////////////////////////
      const groupConversations: IGroupConversation[] = [];
      delete conversation._id;

      members.forEach((m) => {
        const receiverMessage = members.map((m) => ({
          id: crypto.randomUUID(),
          conversationId: conversation.conversationId,
          from: "system",
          message: `${socket.username} added ${m.id === m.id ? "you" : m.username} to the group`,
        }));

        groupConversations.push({
          ...conversation,
          id: new Types.ObjectId().toHexString(),
          conversationId: conversation.conversationId,
          userId: m.id,
          members: [...conversation.members, m],
          active: true,
          joinedAt: Date.now(),
        });

        io.to(m.id).emit(
          "GROUP_ADD_MEMBERS",
          {
            conversation: {
              ...conversation,
              members: [...conversation.members, ...members],
            },
            conversationId: conversation.conversationId,
            members,
          },
          receiverMessage
        );
      });

      const body = {
        conversationId: conversation.conversationId,
        members: _members,
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
    }: {
      conversation: IGroupConversation;
      user: IUser;
    }) => {
      const body = {
        conversationId: conversation.conversationId,
        userId: user.id,
      };

      const req = {
        userId: user.id,
        conversationId: conversation.conversationId,
      };

      produceMessage(req, "LEAVE_GROUP");

      const broadcastMessage: Partial<IMessage>[] = [
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          from: "system",
          message: `${socket.username} removed ${user.username} from the group`,
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
          message: `${socket.username} removed you from the group`,
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

  socket.on(
    "USER_MAKE_ADMIN",
    async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const body = { conversationId, userId };

      const conversation: IGroupConversation = await axiosClient
        .patch(`/group/admins/add`, body)
        .then((res) => res.data[0])
        .catch((res) => res);

      io.to(conversation.channelId!).emit(
        "SET_GROUP_ADMIN",
        conversationId,
        userId,
        true
      );
    }
  );

  socket.on(
    "USER_REMOVE_FROM_ADMIN",
    async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const body = { conversationId, userId };

      const conversation: IGroupConversation = await axiosClient
        .patch(`/group/admins/remove`, body)
        .then((res) => res.data[0])
        .catch((res) => res);

      const members = conversation.members.map((m) => m.id);

      io.to(members).emit("SET_GROUP_ADMIN", conversationId, userId, false);
    }
  );
}
