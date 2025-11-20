import { IGroup, MemberReq } from "@repo/interfaces/groupInterface";
import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  conversationClearReq,
  groupConversationsSchema, membersSchema,
  groupSchema
} from "../schemas/groupSchema";
import {
  addGroupTag,
  addMembersToGroup,
  clearGroupConversation,
  createGroup,
  deleteGroup,
  fetchGroupById,
  fetchGroupByInvitationId,
  fetchGroups, generateGroupInvitationId,
  makeUserAdmin,
  removeGroupTag,
  removeMemberFromGroup,
  removeUserAdmin,
  updateGroup,
  updateGroupMemberRole
} from "../services/groupServices";
import { handleUpdatingGroupConversationSyncState } from "../services/utils/conversation";

const _createGroup = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const group = groupSchema.parse(body.group);
    const groupConversations = groupConversationsSchema.parse(body.groupConversations);

    const conversations = await createGroup(group, groupConversations);

    if (conversations?.ok) await handleUpdatingGroupConversationSyncState(groupConversations);

    res.json(conversations);
  } catch (error) {
    res.send(null);
    console.log("CREATE_GROUP error--->", error);
  }
};

const _fetchGroups = async (req: Request, res: Response) => {
  const group = await fetchGroups();

  res.json(group);
};

const _generateGroupInvitationId = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body;

    const group = await generateGroupInvitationId(conversationId);

    res.json(group);
  } catch (error) {
    console.log("error _generateGroupInvitationId---->", error);
  }
};

const _updateGroup = async (req: string, reset: () => void) => {
  try {
    const parsed: { groupId: string; updates: Partial<IGroup> } = JSON.parse(req);

    const conversationId = new Types.ObjectId(parsed.groupId);
    const updates = parsed.updates;

    await updateGroup(conversationId, updates);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _deleteGroup = async (req: Request, res: Response) => {
  const groupId = req.params.id;

  if (!groupId) throw new Error("Group ID is required");

  try {
    const group = await deleteGroup(groupId);
    res.json(group);
  } catch (error) {
    res.json(error);
  }
};

const _addMembersToGroup = async (req: string, reset: () => void) => {
  try {
    const parsed: { members: MemberReq; groupId: string } = JSON.parse(req);
    const members = membersSchema.parse(parsed.members);
    const groupId = new Types.ObjectId(parsed.groupId);

    await addMembersToGroup(groupId, members);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _removeMemberFromGroup = async (req: string, reset: () => void) => {
  try {
    const parsed: { userId: string; conversationId: string; memberId: string } = JSON.parse(req);
    const userId = new Types.ObjectId(parsed.userId);
    const conversationId = new Types.ObjectId(parsed.conversationId);
    const memberId = new Types.ObjectId(parsed.memberId);

    const group = await removeMemberFromGroup({ conversationId, userId, memberId });
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _updateGroupMemberRole = async (req: Request, res: Response) => {
  const { groupId, userId, isAdmin } = req.body;

  const group = await updateGroupMemberRole(groupId, userId, isAdmin);

  res.json(group);
};

const _fetchGroupById = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) throw new Error("Group ID is required");

  try {
    const group = await fetchGroupById(id);

    res.json(group);
  } catch (error) {
    res.json(error);
  }
};

const _fetchGroupByInvitationId = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) throw new Error("Group ID is required");

  try {
    const groups = await fetchGroupByInvitationId(id);

    res.json(groups);
  } catch (error) {
    res.json(error);
  }
};

// const _fetchGroupsByUserId = async (req: Request, res: Response) => {
//   try {
//     const userId = objectId.parse(req.params.id);

//     if (!userId) throw new Error("User ID is required");

//     const groups = await fetchGroupsByUserId(userId);
//     res.json(groups);
//   } catch (error) {
//     res.json(error);
//   }
// };

const _makeUserAdmin = async (req: string, reset: () => void) => {
  try {
    const parsed: any = JSON.parse(req);

    const conversationId = new Types.ObjectId(parsed.conversationId as string);
    const userId = new Types.ObjectId(parsed.userId as string);

    const groups = await makeUserAdmin(conversationId, userId);
  } catch (error) {
    console.log("_makeUserAdmin error--->", error);
    reset();
  }
};

const _removeUserAdmin = async (req: string, reset: () => void) => {
  try {
    const parsed: any = JSON.parse(req);

    const conversationId = new Types.ObjectId(parsed.conversationId as string);
    const userId = new Types.ObjectId(parsed.userId as string);

    const groups = await removeUserAdmin(conversationId, userId);
  } catch (error) {
    console.log("_removeUserAdmin error--->", error);
    reset();
  }
};

const _clearGroupConversation = async (req: string, reset: () => void) => {
  try {
    const parsed: any = JSON.parse(req);
    const parsedRequest = conversationClearReq.parse(parsed);

    await clearGroupConversation(parsedRequest);
  } catch (error) {
    console.log("CLEAR_GROUP_CONVERSATION_FOR_USER error--->", error);
    reset();
  }
};

const _addTag = async (req: string, reset: () => void) => {
  try {
    const parsed: any = JSON.parse(req);

    const update = {
      ...parsed,
      id: new Types.ObjectId(parsed.id as string),
    };

    await addGroupTag(update);
  } catch (error) {
    console.log("ADD_TAG error--->", error);
    reset();
  }
};

const _removeTag = async (req: string, reset: () => void) => {
  try {
    const parsed: any = JSON.parse(req);

    const update = {
      ...parsed,
      id: new Types.ObjectId(parsed.id as string),
    };

    removeGroupTag(update);
  } catch (error) {
    console.log("REMOVE_TAG error--->", error);
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
  _fetchGroupById,
  // _fetchGroupsByUserId,
  _fetchGroupByInvitationId,
  _makeUserAdmin,
  _removeUserAdmin,
  _clearGroupConversation,
  _addTag,
  _removeTag,
};
