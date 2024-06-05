import { Router } from 'express'
import groupController from '../controller/groupController'

const router = Router()

router
    .get('/', groupController._fetchGroups)

    .post('/create', groupController._createGroup)

    .patch('/update', groupController._updateGroup)

    .delete('/delete/:id', groupController._deleteGroup)

    .post('/add', groupController._addMemberToGroup)

    .delete('/remove', groupController._removeMemberFromGroup)

    .patch('/change-role', groupController._updateGroupMemberRole)

    .get('/:id', groupController._fetchGroupsByUserId)

export default router