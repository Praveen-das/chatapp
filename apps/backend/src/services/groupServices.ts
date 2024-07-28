import Group from '../models/groupModel'

interface IGroupMember {
    username: string
    userId: string
    isAdmin: boolean
}

interface IGroup {
    id: string,
    channelId?: string,
    displayName?: string
    host?: 'user' | 'group'
    members: IGroupMember[],
    createdAt: number,
    updatedAt: number,
}

// createGroup
async function createGroup(data: IGroup) {
    try {
        const group = new Group(data)
        await group.save()
        const populatedGroup = await Group.aggregate([
            {
                $match: { id: group.id }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: 'id',
                    as: 'members'
                }
            },
        ])

        return populatedGroup[0]

    } catch (error) {
        console.log('createGroup--->', error);
        throw error
    }
}
async function generateGroupInvitationId(id: string) {
    try {
        const invitationId = crypto.randomUUID()
        await Group.findOneAndUpdate({ id }, { invitationId })
        const populatedGroup = await Group.aggregate([
            {
                $match: { id }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: 'id',
                    as: 'members'
                }
            },
        ])

        return populatedGroup[0]

    } catch (error) {
        console.log('createGroup--->', error);
        throw error
    }
}

// fetchGroupsForUser
async function fetchGroupById(id: string) {
    try {
        const groups = await Group
            .aggregate([
                {
                    $match: { invitationId: id }
                },
                {
                    $lookup: {
                        from: "messages",
                        let: { id: "$id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$conversationId", "$$id"] }
                                },
                            },
                        ],
                        as: "messages"
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'members',
                        foreignField: 'id',
                        as: 'members'
                    }
                },
            ])

        return groups

    } catch (error) {
        console.log('fetchGroupsByUserId--->', error);
    }
}

async function fetchGroupsByUserId(userId: string) {
    try {
        const groups = await Group
            .aggregate([
                {
                    $match: {
                        members: {
                            $in: [userId]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "messages",
                        let: { id: "$id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$conversationId", "$$id"] }
                                },
                            },
                            {
                                $match: {
                                    deletedFor: {
                                        $nin: [userId]
                                    }
                                }
                            },
                            {
                                $project: {
                                    deletedFor: 0
                                }
                            }
                        ],
                        as: "messages"
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'members',
                        foreignField: 'id',
                        as: 'members'
                    }
                },
            ])


        return groups

    } catch (error) {
        console.log('fetchGroupsByUserId--->', error);
    }
}

// fetchAllGroups
async function fetchGroups() {
    try {

        const groups = await Group
            .aggregate([
                {
                    $addFields: {
                        id: { $toString: '$_id' }
                    }
                },
                {
                    $lookup: {
                        from: 'messages',
                        localField: 'id',
                        foreignField: 'to',
                        as: 'messages'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'members',
                        foreignField: 'id',
                        as: 'members'
                    }
                },
            ])

        return groups

    } catch (error) {
        console.log('fetchGroupsByUserId--->', error);

    }
}

// updateGroupMemberRole
async function updateGroupMemberRole(groupId: string, userId: string, isAdmin: boolean) {
    try {

        const updatedGroup = await Group
            .findOneAndUpdate(
                { id: groupId, 'members.userId': userId },
                { $set: { 'members.$.isAdmin': isAdmin } },
                { new: true });

        return updatedGroup;

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

async function addMemberToGroup(conversationId: string, users: string[]) {
    try {

        const updatedGroup = await Group
            .findOneAndUpdate({ id: conversationId }, {
                $push: { members: users }
            }, { new: true });

        return await Group.aggregate([
            {
                $match: { id: conversationId }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: 'id',
                    as: 'members'
                }
            },
        ]);

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

// removeMemberFromGroup
async function removeMemberFromGroup(conversationId: string, userId: string) {
    try {
        const updatedGroup = await Group
            .findOneAndUpdate({ id: conversationId }, {
                $pull: { members: userId }
            }, { new: true });

        return await Group.aggregate([
            {
                $match: { id: conversationId }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: 'id',
                    as: 'members'
                }
            },
        ]);

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

// updateGroup
async function updateGroup(conversationId: string, updates: Partial<IGroup>) {

    try {

        const updatedGroup = await Group
            .findOneAndUpdate({ id: conversationId }, updates, { new: true });

        return await Group.aggregate([
            {
                $match: { id: conversationId }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: 'id',
                    as: 'members'
                }
            },
        ]);

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

// deleteGroup
async function deleteGroup(groupId: string) {
    try {

        const updatedGroup = await Group.findByIdAndDelete(groupId);

        return updatedGroup;

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

// make user as admin
async function makeUserAdmin(conversationId: string, userId: string) {
    try {

        const updatedGroup = await Group
            .findOneAndUpdate({ id: conversationId }, {
                $push: { admins: userId }
            }, { new: true });

        return await Group.aggregate([
            {
                $match: { id: conversationId }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: 'id',
                    as: 'members'
                }
            },
        ]);

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

// remove user from admin
async function removeUserAdmin(conversationId: string, userId: string) {
    try {
        const updatedGroup = await Group
            .findOneAndUpdate({ id: conversationId }, {
                $pull: { admins: userId }
            }, { new: true });

        return await Group.aggregate([
            {
                $match: { id: conversationId }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: 'id',
                    as: 'members'
                }
            },
        ]);

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

export {
    createGroup,
    generateGroupInvitationId,
    fetchGroups,
    fetchGroupsByUserId,
    addMemberToGroup,
    removeMemberFromGroup,
    updateGroupMemberRole,
    updateGroup,
    deleteGroup,
    fetchGroupById,
    makeUserAdmin,
    removeUserAdmin,
}
