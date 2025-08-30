import { Router } from 'express'
import userController from '../controller/userController'

const router = Router()

router
    .get('/', userController._getUser)
    .get('/search', userController._queryUser)
    .get('/all', userController._getAllUsers)
    .post('/', userController._createUser)
    .put('/', userController._updateUser)
    .delete('/:id', userController._deleteUser)

export default router