import cache from '../redis/client'
import { Response, Request } from 'express'
import { deleteUserMessages, getMessages, getUserMessages } from '../services/messageServices';

const TIME_TO_EXPIRE = 60 * 60 * 24

const _getMessages = async (req: Express.Request, res: Response) => {
    const messages_cache = await cache.get('messages_cache')

    if (messages_cache) {
        console.log('res send from cache');
        return res.json(JSON.parse(messages_cache))
    }

    const messages = await getMessages()

    cache.set(
        "messages_cache",
        JSON.stringify(messages),
        () => console.log('data cached')
    )
    cache.expire("messages_cache", TIME_TO_EXPIRE)

    return res.json(messages)
}

const _getUserMessages = async (req: Request, res: Response) => {
    const userId = req.query.userId as string
    const cacheKey = `messages_cache:${userId}`

    try {
        // const messages_cache = await cache.get(cacheKey)

        // if (messages_cache) {
        //     console.log('res send from cache');
        //     return res.json(JSON.parse(messages_cache))
        // }

        const _messages = await getUserMessages(userId)
        
        const messages = _messages

        // cache.set(
        //     cacheKey,
        //     JSON.stringify(messages),
        //     () => console.log('data cached')
        // )

        cache.expire(cacheKey, TIME_TO_EXPIRE)

        res.json(messages)
    } catch (error) {
        res.send(error)
    }
}

const _deleteUserMessage = async (req: Request, res: Response) => {
    const userId = req.body.userId
    const messagesId = req.body.messagesId

    const cacheKey = `messages_cache:${userId}`


    try {
        const response = await deleteUserMessages(messagesId)
        console.log(response);
        cache.del(cacheKey)
        res.send('ok')
    } catch (error) {
        res.send(error)
    }
}

export default {
    _getMessages,
    _getUserMessages,
    _deleteUserMessage
}