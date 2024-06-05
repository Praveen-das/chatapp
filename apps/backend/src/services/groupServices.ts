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
        return group

    } catch (error) {
        console.log('createGroup--->', error);
        throw error
    }
}

// fetchGroupsForUser
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
                                    $expr: {
                                        $eq: ["$conversationId", "$$id"]
                                    }
                                }
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
            ])
        // .find({
        //     members: {
        //         $in: [userId]
        //     }
        // })
        // .aggregate([
        //     {
        //         $match: { 'members.userId': userId }
        //     },
        //     // {
        //     //     $addFields: {
        //     //         id: { $toString: '$_id' }
        //     //     }
        //     // },
        //     // {
        //     //     $lookup: {
        //     //         from: 'messages',
        //     //         localField: 'id',
        //     //         foreignField: 'to',
        //     //         as: 'messages'
        //     //     }
        //     // }
        // ])
        // .where('members.userId')
        // .equals(userId)
        // .loo


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
                }
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
                { _id: groupId, 'members.userId': userId },
                { $set: { 'members.$.isAdmin': isAdmin } },
                { new: true });

        return updatedGroup;

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}
async function addMemberToGroup(groupId: string, user: IGroupMember) {
    try {

        const updatedGroup = await Group
            .findByIdAndUpdate(groupId, {
                $push: { members: user }
            }, { new: true });

        return updatedGroup;

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

// removeMemberFromGroup
async function removeMemberFromGroup(groupId: string, userId: string) {
    try {

        const updatedGroup = await Group
            .findByIdAndUpdate(groupId, {
                $pull: { members: { _id: userId } }
            }, { new: true });

        return updatedGroup;

    } catch (error) {
        console.error('Error adding user to group:', error);
        throw error;
    }
}

// updateGroup
async function updateGroup(groupId: string, updates: Partial<IGroup>) {
    try {

        const updatedGroup = await Group
            .findByIdAndUpdate(groupId, updates, { new: true });

        return updatedGroup;

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

export {
    createGroup,
    fetchGroups,
    fetchGroupsByUserId,
    addMemberToGroup,
    removeMemberFromGroup,
    updateGroupMemberRole,
    updateGroup,
    deleteGroup
}
