import { Router } from 'express'
import userController from '../controller/userController'
import { verifyAuth } from '../middlewares/auth'

const router = Router()

router
    .get('/', userController._getUser)
    .get('/search', userController._queryUser)
    .get('/all', userController._getAllUsers)
    .post('/', userController._createUser)
    // .get('/fetch', userController._getUser)
    .post('/block', userController._blockUser)
    .get('/blockedList/:id', userController._getBlockedListByUserId)
    .delete('/unblock/:id', userController._unblockUser)
    // .get('/:id', userController._getUserById)
    .put('/:id', userController._updateUser)
    .delete('/:id', userController._deleteUser)

export default router