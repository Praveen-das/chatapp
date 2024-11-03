import { Router } from 'express'
import conversationController from '../controller/conversationController'

const router = Router()

router
    .route('/')
    .get(conversationController._fetchAllConversations)
    .post(conversationController._createConversation)
    .put(conversationController._updateConversationById)

router.put('/archive', conversationController._addToArchive)
router.put('/unarchive', conversationController._removeFromArchive)
router.get('/:userId', conversationController._getUserConversation)

export default router