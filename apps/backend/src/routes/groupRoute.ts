import { Router } from 'express'
import groupController from '../controller/groupController'

const router = Router()

router
    .get('/', groupController._fetchGroups)

    .post('/create', groupController._createGroup)

    .patch('/generateInvitationId', groupController._generateGroupInvitationId)

    .patch('/update', groupController._updateGroup)

    .delete('/delete/:id', groupController._deleteGroup)

    .post('/add', groupController._addMembersToGroup)

    .patch('/admins/add', groupController._makeUserAdmin)

    .patch('/admins/remove', groupController._removeUserAdmin)

    .patch('/remove', groupController._removeMemberFromGroup)

    .patch('/change-role', groupController._updateGroupMemberRole)

    .get('/fetch/:id', groupController._fetchGroupById)

    .get('/:id', groupController._fetchGroupsByUserId)

export default router