import { Router } from 'express'
import Messages from '../models/MessageModel'

const router = Router()

router
    .route('/')
    .get((req, res) => {
        // Messages.find()
    })

export default router