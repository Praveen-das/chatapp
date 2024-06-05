import { Router } from 'express'
import conversationRoute from './conversationRoute'
import messagesRouter from './messagesRoute'
import userRoute from './userRoute'
import groupRoute from './groupRoute'

const router = Router()

router.get('/', (_, res) => res.json('chat app server'))

router.use('/conversation', conversationRoute)

router.use('/messages', messagesRouter)

router.use('/user', userRoute)

router.use('/group', groupRoute)

export default router