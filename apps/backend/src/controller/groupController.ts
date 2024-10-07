import { Request, Response } from "express";
import { Types } from "mongoose";
import { IGroup } from "../interfaces/groupInterface";
import {
  addMembersToGroup,
  clearGroupConversation,
  createGroup,
  deleteGroup,
  fetchGroupById,
  fetchGroups,
  fetchGroupsByUserId,
  generateGroupInvitationId,
  makeUserAdmin,
  removeMemberFromGroup,
  removeUserAdmin,
  updateGroup,
  updateGroupMemberRole,
} from "../services/groupServices";

const _fetchGroups = async (req: Request, res: Response) => {
  const group = await fetchGroups();

  res.json(group);
};

const _createGroup = async (
  req: Request<any, any, IGroupCreationReq>,
  res: Response
) => {
  const data = req.body;

  const members = data.members.map((userId) => ({
    id: new Types.ObjectId(userId),
    timeOfJoining: Date.now(),
  }));

  const admins = data.admins.map((userId) => new Types.ObjectId(userId));

  const groupModel: IGroup = {
    ...data,
    id: new Types.ObjectId(data.id),
    channelId: new Types.ObjectId(),
    host: "group",
    admins,
    members,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const group = await createGroup(groupModel);

  res.json(group);
};

const _generateGroupInvitationId = async (req: Request, res: Response) => {
  const { conversationId } = req.body;

  const group = await generateGroupInvitationId(conversationId);

  res.json(group);
};

const _updateGroup = async (req: Request, res: Response) => {
  const { groupId, updates } = req.body;

  const group = await updateGroup(groupId, updates);

  res.json(group);
};

const _deleteGroup = async (req: Request, res: Response) => {
  const groupId = req.params.id;

  const group = await deleteGroup(groupId);

  res.json(group);
};

const _addMembersToGroup = async (req: Request, res: Response) => {
  const { conversationId, members } = req.body;

  const group = await addMembersToGroup(conversationId, members);

  res.json(group);
};

const _removeMemberFromGroup = async (req: Request, res: Response) => {
  const { conversationId, userId } = req.body;

  const group = await removeMemberFromGroup(conversationId, userId);

  res.json(group);
};

const _updateGroupMemberRole = async (req: Request, res: Response) => {
  const { groupId, userId, isAdmin } = req.body;

  const group = await updateGroupMemberRole(groupId, userId, isAdmin);

  res.json(group);
};

const _fetchGroupById = async (req: Request, res: Response) => {
  const id = req.params.id;

  const groups = await fetchGroupById(id);

  res.json(groups);
};

const _fetchGroupsByUserId = async (req: Request, res: Response) => {
  const userId = req.params.id;

  const groups = await fetchGroupsByUserId(userId);

  res.json(groups);
};

const _makeUserAdmin = async (req: Request, res: Response) => {
  const { conversationId, userId } = req.body;

  const groups = await makeUserAdmin(conversationId, userId);

  res.json(groups);
};

const _removeUserAdmin = async (req: Request, res: Response) => {
  const { conversationId, userId } = req.body;

  const groups = await removeUserAdmin(conversationId, userId);

  res.json(groups);
};

const _clearGroupConversation = async (req: string, reset: () => void) => {
  try {
    const parsed:any = JSON.parse(req);
    
    const conversation = {
      ...parsed,
      conversationId: new Types.ObjectId(parsed.conversationId as string),
      userId: new Types.ObjectId(parsed.userId as string),
    };

    await clearGroupConversation(conversation);
  } catch (error) {
    console.log("CLEAR_GROUP_CONVERSATION_FOR_USER error--->", error);
    reset();
  }
};

export default {
  _fetchGroups,
  _generateGroupInvitationId,
  _createGroup,
  _updateGroup,
  _deleteGroup,
  _addMembersToGroup,
  _removeMemberFromGroup,
  _updateGroupMemberRole,
  _fetchGroupsByUserId,
  _fetchGroupById,
  _makeUserAdmin,
  _removeUserAdmin,
  _clearGroupConversation
};
