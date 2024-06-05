import { Request, Response } from 'express'
import { addMemberToGroup, createGroup, deleteGroup, fetchGroups, fetchGroupsByUserId, removeMemberFromGroup, updateGroup, updateGroupMemberRole } from '../services/groupServices'

const _fetchGroups = async (req: Request, res: Response) => {

    const group = await fetchGroups()

    res.json(group)
}

const _createGroup = async (req: Request, res: Response) => {

    const data = req.body

    const group = await createGroup(data)

    res.json(group)
}

const _updateGroup = async (req: Request, res: Response) => {

    const { groupId, updates } = req.body

    const group = await updateGroup(groupId, updates)

    res.json(group)

}

const _deleteGroup = async (req: Request, res: Response) => {

    const groupId = req.params.id

    const group = await deleteGroup(groupId)

    res.json(group)

}

const _addMemberToGroup = async (req: Request, res: Response) => {

    const { groupId, user } = req.body

    const group = await addMemberToGroup(groupId, user)

    res.json(group)

}

const _removeMemberFromGroup = async (req: Request, res: Response) => {

    const { groupId, userId } = req.body

    const group = await removeMemberFromGroup(groupId, userId)

    res.json(group)

}

const _updateGroupMemberRole = async (req: Request, res: Response) => {

    const { groupId, userId, isAdmin } = req.body

    const group = await updateGroupMemberRole(groupId, userId, isAdmin)

    res.json(group)

}

const _fetchGroupsByUserId = async (req: Request, res: Response) => {

    const userId = req.params.id

    const groups = await fetchGroupsByUserId(userId)

    res.json(groups)
}

export default {
    _fetchGroups,
    _createGroup,
    _updateGroup,
    _deleteGroup,
    _addMemberToGroup,
    _removeMemberFromGroup,
    _updateGroupMemberRole,
    _fetchGroupsByUserId
}