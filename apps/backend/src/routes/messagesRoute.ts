import { Router } from 'express'
import messageController from '../controller/messageController'

const router = Router()

router
    .route('/')
    .get(messageController._getUserMessages)
    .delete(messageController._deleteUserMessage)

export default router