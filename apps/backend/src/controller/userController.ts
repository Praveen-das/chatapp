import { Request, Response } from 'express'
import userServices from '../services/userServices'

const _createUser = async (req: Request, res: Response) => {
    const body = req.body

    const user = await userServices.createUser(body)

    res.json(user)
}

const _getAllUsers = async (req: Request, res: Response) => {
    const users = await userServices.getAllUsers()
    res.json(users)

}

const _getUserById = async (req: Request, res: Response) => {
    let userId = req.params.id
    const user = await userServices.getUserById(userId)
    res.json(user)
}

const _updateUser = async (req: Request, res: Response) => {
    let userId = req.params.id
    
    let updates = req.body

    const user = await userServices.updateUser(userId, updates)
    res.json(user)
}

const _deleteUser = async (req: Request, res: Response) => {
    let userId = req.params.id

    const user = await userServices.deleteUser(userId)
    res.json(user)
}

export default {
    _createUser,
    _getAllUsers,
    _getUserById,
    _updateUser,
    _deleteUser
}