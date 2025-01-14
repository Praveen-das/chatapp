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
import { IUserConversation } from "../interfaces/conversationInterface";

const _fetchGroups = async (req: Request, res: Response) => {
  const group = await fetchGroups();

  res.json(group);
};

const _createGroup = async (req: string, reset: () => void) => {
  const { group }: { group: IGroup } = JSON.parse(req);

  const members = group.members.map((m) => new Types.ObjectId(m.id));

  const groupModel: IGroup = {
    ...group,
    id: new Types.ObjectId(group.id),
    createdBy: new Types.ObjectId(group.createdBy),
    members,
  };

  createGroup(groupModel);
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

const _addMembersToGroup = async (req: string, reset: () => void) => {
  try {
    const parsed: { conversationId: string; members: string[] } =
      JSON.parse(req);

    const conversationId = new Types.ObjectId(parsed.conversationId);
    const members = parsed.members.map((id) => new Types.ObjectId(id));

    await addMembersToGroup(conversationId, members);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _removeMemberFromGroup = async (req: string, reset: () => void) => {
  try {
    const parsed: { userId: string; conversationId: string } = JSON.parse(req);
    const userId = new Types.ObjectId(parsed.userId);
    const conversationId = new Types.ObjectId(parsed.conversationId);

    const group = await removeMemberFromGroup(conversationId, userId);
  } catch (error) {
    console.log(error)
    reset()
  }
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
    const parsed: any = JSON.parse(req);

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
  _clearGroupConversation,
};
