import Messages from "../models/MessageModel";
import client from "../redis/client";

async function saveUserMessage(messages: IMessage[]) {
    try {
        const res = await Messages.insertMany(messages)
        await client.del('messages_cache')
        return res
    } catch (error) {
        console.log("saveUserMessage----->", error);
    }
}

async function getMessages() {
    try {
        return await Messages.find()
    } catch (error) {
        console.log(error);
    }
}

async function getUserMessages(userId: string): Promise<Map<string, IMessage[]>> {
    try {
        const res = await Messages.aggregate([
            {
                $lookup: {
                    from: "groups",
                    let: {
                        conversationId: "$conversationId"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$id", "$$conversationId"]
                                }
                            }
                        }
                    ],
                    as: "conversation"
                }
            },
            {
                $unwind: "$conversation"
            },
            {
                $match: { "conversation.members": userId }
            },
            {
                $group: {
                    _id: "$conversationId",
                    messages: {
                        $push: {
                            $cond: {
                                if: {
                                    $in: [
                                        userId,
                                        "$deletedFor"
                                    ]
                                },
                                then: "$$REMOVE",
                                else: {
                                    id: "$id",
                                    conversationId: "$conversationId",
                                    from: "$from",
                                    to: "$to",
                                    timestamp: "$timestamp",
                                    message: "$message",
                                    reply: "$reply",
                                    readReceipt: "$readReceipt"
                                }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    conversationId: "$_id"
                }
            },
            {
                $project: {
                    _id: 0,
                    "messages.deletedFor": 0
                }
            }
        ])

        const response: any = res.map(({ conversationId, messages }) => [conversationId, messages])

        return response
    } catch (error) {
        console.log("getUserMessages---->", error);
        return new Map()
    }
}

async function deleteUserMessages(messagesId: string[]) {
    try {
        const res = await Messages.deleteMany({ id: { $in: messagesId } })
    } catch (error) {
        console.log("getUserMessages---->", error);
    }
}

const updateUserMessages = async (updates: Partial<IMessage>[]) => {
    var bulkOps: BulkOperation[] = [];
    
    updates.forEach((update) => {
        const { id, ...items } = update
        let updateObj

        if (!!items.readReceipt?.length) {
            updateObj = {
                $set: {
                    "readReceipt.$[element].status": items.readReceipt[0].status
                }
            };

            bulkOps.push({
                updateOne: {
                    filter: { id },
                    update: updateObj,
                    arrayFilters: [{ "element.userId": items.readReceipt?.[0].userId }]
                }
            });
        }
        else {
            updateObj = { $set: items };
            bulkOps.push({
                updateOne: {
                    filter: { id },
                    update: updateObj,
                }
            });
        }
    });

    try {
        const res = await Messages.bulkWrite(bulkOps)
    } catch (error) {
        console.log(error);
    }
}

const deleteMessageForUser = async (collection: { id: string, deletedFor: string }[]) => {
    var bulkOps: BulkOperation[] = [];

    collection.forEach(({ id, deletedFor }) => {
        bulkOps.push({
            updateOne: {
                filter: { id },
                update: { $push: { deletedFor } }
            }
        });
    });

    try {
        const res = await Messages.bulkWrite(bulkOps)
    } catch (error) {
        console.log(error);
    }
}

export {
    getMessages,
    getUserMessages,
    saveUserMessage,
    updateUserMessages,
    deleteUserMessages,
    deleteMessageForUser
}
