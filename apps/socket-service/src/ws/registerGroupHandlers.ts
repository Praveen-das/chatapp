import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { createChatGroup } from "../services/groupServices";
import axiosClient from "../lib/axiosClient";
import produceMessage from "../kafka/kafka";

function getUpdatedValues(obj: IGroupConversation, key: string) {
  const value = { [key]: obj[key as keyof typeof obj] };
  return { id: obj.id, ...value };
}

export default function registerGroupHandlers(io: Server, socket: ISocket) {
  socket.on("create group", async (conversation: IGroupCreationReq) => {
    if (!socket.userId) return;

    const sockets = io.sockets.sockets;

    const group = await createChatGroup(conversation);

    group.members.forEach((m) => {
      let userId = m.id;
      if (!userId) return;

      sockets.forEach((_socket: ISocket) => {
        if (_socket.userId === userId) _socket.join(group.channelId!);
      });
    });

    io.to(group.channelId).emit("group created", group);
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
      const body = { groupId: conversation.id, updates: updates };
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
        conversationId: conversation.id,
        from: "system",
        message: messageString,
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
    "GROUP_JOIN",
    async ({
      conversation,
      user,
    }: {
      conversation: IGroupConversation;
      user: IUser;
    }) => {
      const body = {
        conversationId: conversation.id,
        members: [{ id: user.id, timeOfJoining: Date.now() } as any],
      };

      const _conversation = await axiosClient
        .post(`/group/add`, body)
        .then((res) => res.data[0])
        .catch((res) => res);

      socket.join(conversation.channelId!);

      const broadcastMessage: Partial<IMessage>[] = [
        {
          conversationId: conversation.id,
          from: "system",
          message: `${user.username} joined the group`,
        },
      ];

      const userMessage: Partial<IMessage>[] = [
        {
          conversationId: conversation.id,
          from: "system",
          message: `You joined the group`,
        },
      ];

      socket.emit(
        "GROUP_ADD_MEMBERS",
        { conversation: _conversation, members: [user] },
        userMessage
      );
      io.to(conversation.channelId!)
        .except(user.id)
        .emit(
          "GROUP_ADD_MEMBERS",
          { conversation: _conversation, members: [user] },
          broadcastMessage
        );
    }
  );

  socket.on(
    "GROUP_LEAVE",
    async ({
      conversation,
      user,
    }: {
      conversation: IGroupConversation;
      user: IUser;
    }) => {
      const body = { conversationId: conversation.id, userId: user.id };

      // await axiosClient
      //   .patch(`/group/remove`, body)
      //   .then((res) => res.data[0])
      //   .catch((res) => res);

      const message: Partial<IMessage>[] = [
        {
          conversationId: conversation.id,
          from: "system",
          message: `${user.username} left the group`,
        },
      ];

      io.to(conversation.channelId!).emit(
        "GROUP_REMOVE_MEMBER",
        { id: conversation.id, userId: user.id },
        message
      );

      socket.leave(conversation.channelId!);
    }
  );

  socket.on(
    "GROUP_ADD_MEMBERS",
    async ({
      conversation,
      members,
    }: {
      conversation: IGroupConversation;
      members: string[];
    }) => {
      const _members = members.map(
        (id) => ({ id, timeOfJoining: Date.now() }) as any
      );

      const body = { conversationId: conversation.id, members: _members };

      const newConversation: IGroupConversation = await axiosClient
        .post(`/group/add`, body)
        .then((res) => res.data[0])
        .catch((res) => res);

      const sockets = io.sockets.sockets;

      members.forEach((id) => {
        sockets.forEach((_socket: ISocket) => {
          if (_socket.userId === id) _socket.join(conversation.channelId!);
        });
      });

      const newMembers = newConversation.members.filter((m) =>
        members.includes(m.id)
      );

      const messages = newMembers.map((m) => ({
        conversationId: conversation.id,
        from: "system",
        message: `${socket.username} added ${m.username}`,
      }));

      const userMessages = newMembers.map((m) => ({
        conversationId: conversation.id,
        from: "system",
        message: `${socket.username} added you to the group`,
      }));

      io.to(members).emit(
        "GROUP_ADD_MEMBERS",
        { conversation, members: newMembers },
        userMessages
      );

      io.to(conversation.channelId!)
        .except(members)
        .emit(
          "GROUP_ADD_MEMBERS",
          { conversation, members: newMembers },
          messages
        );
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
      const body = { conversationId: conversation.id, userId: user.id };

      await axiosClient
        .patch(`/group/remove`, body)
        .then((res) => res.data[0])
        .catch((res) => res);

      const sockets = io.sockets.sockets;

      sockets.forEach((_socket: ISocket) => {
        if (_socket.userId === user.id) _socket.leave(conversation.channelId!);
      });

      const message: Partial<IMessage>[] = [
        {
          conversationId: conversation.id,
          from: "system",
          message: `${socket.username} removed ${user.username} from the group`,
        },
      ];

      io.to(conversation.channelId!).emit(
        "GROUP_REMOVE_MEMBER",
        { id: conversation.id, userId: user.id },
        message
      );
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

      const updatedConversation = getUpdatedValues(conversation, "admins");

      io.to(conversation.channelId!).emit("UPDATE_GROUP", updatedConversation);
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

      const updatedConversation = getUpdatedValues(conversation, "admins");

      io.to(members).emit("UPDATE_GROUP", updatedConversation);
    }
  );
}
