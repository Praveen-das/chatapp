import { Router } from 'express'
import conversationController from '../controller/conversationController'

const router = Router()

router
    .route('/')
    .get(conversationController._fetchAllConversations)
    .post(conversationController._createConversation)
    .put(conversationController._updateConversationById)

router.get('/:userId', conversationController._getUserConversation)

export default router