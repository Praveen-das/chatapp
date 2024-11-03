import { Router } from 'express'
import conversationController from '../controller/conversationController'

const router = Router()

router.post('/add', conversationController._addToArchive)
router.post('/remove', conversationController._removeFromArchive)

export default router