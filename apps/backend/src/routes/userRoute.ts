import { Router } from 'express'
import userController from '../controller/userController'

const router = Router()

router
    .get('/', userController._getAllUsers)
    .post('/', userController._createUser)
    .get('/:id', userController._getUserById)
    .put('/:id', userController._updateUser)
    .delete('/:id', userController._deleteUser)

export default router