import Redis from "ioredis";
import { IMessage } from "../interfaces/messageInterface";

class MessageCachingService {
    redisClient

    constructor() {
        this.redisClient = new Redis();
    }

    saveMessages(messages: IMessage[]) {
        type array = string[]

        const commands: array[][] = messages.map(message => {
            const value = JSON.stringify(message);
            return [
                ['rpush', `messages:${message.from}`, value],
                ['rpush', `messages:${message.to}`, value]
            ]
        })

        this.redisClient
            .multi(...commands)
            .exec()
            .then((res) => {
                console.log(res);
            })
    }

    async findMessagesForUser(userId: string) {
        return this.redisClient
            .lrange(`messages:${userId}`, 0, -1)
            .then((results) => {
                return results.map((result) => JSON.parse(result));
            });
    }

    updateUserMessages(messagesId: string[], array: IKeyVal[]): void {
        const response: IRes[] = []

        // this.redisClient
        //     .lset()

        // for (let i = 0; i < array.length; i += 2) {
        //     const key: any = array[i]
        //     const value: any = array[i + 1]

        //     this.redisClient
        //         .multi()
        //         .
        //     // const userMessages = this.findMessagesForUser()

        //     // for (let message of this.messages) {
        //     //     if (messagesId.includes(message.id)) {
        //     //         Object.assign(message, { [key]: value })
        //     //         response.push({ [key]: value, id: message.id })
        //     //     }
        //     // }
        // }

        // return response
    }
}

export default MessageCachingService;
