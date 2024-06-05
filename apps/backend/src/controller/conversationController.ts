import { Request, Response } from "express"
import conversationServices from "../services/conversationServices"

const _createConversation = async (req: Request, res: Response) => {
    const body = req.body
    try {
        const response = await conversationServices.createConversation(body)
        res.json(response)
    } catch (error) {
        console.log(error);
        res.json(error)
    }
}

const _fetchAllConversations = async (req: Request, res: Response) => {
    try {
        const response = await conversationServices.fetchAllConversations()
        res.json(response)
    } catch (error) {
        console.log(error);
        res.json(error)
    }
}

const _getUserConversation = async (req: Request, res: Response) => {
    const userId = req.params.userId

    try {
        const response = await conversationServices.getUserConversation(userId)
        res.json(response)
    } catch (error) {
        console.log(error);
        res.json(error)
    }
}

const _updateConversationById = async (req: Request, res: Response) => {
    const { conversationId, ...updates } = req.body

    try {
        const response = await conversationServices
            .updateConversationById(conversationId, {
                ...updates,
                updatedAt: Date.now()
            })
        res.json(response)
    } catch (error) {
        console.log(error);
        res.json(error)
    }
}

export default {
    _createConversation,
    _fetchAllConversations,
    _getUserConversation,
    _updateConversationById
}