import { Router } from 'express'
import groupController from '../controller/groupController'

const router = Router()

router
    .get('/', groupController._fetchGroups)

    .patch('/generateInvitationId', groupController._generateGroupInvitationId)

    .delete('/delete/:id', groupController._deleteGroup)

    .post('/create', groupController._createGroup)

    .patch('/change-role', groupController._updateGroupMemberRole)

    .get('/fetch/:id', groupController._fetchGroupById)

    .get('/:id', groupController._fetchGroupsByUserId)

export default router