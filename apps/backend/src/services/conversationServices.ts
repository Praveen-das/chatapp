import Conversation from "../models/ConversationModel";

async function createConversation(conversation: IConversation) {
    try {
        const result = await Conversation
            .updateOne(
                { id: conversation.id },
                { $setOnInsert: conversation },
                { upsert: true, new: true }
            );

        return result
    } catch (error) {
        console.error("Error:", error);
        throw error; // Rethrow the error if needed
    }
}

async function fetchAllConversations() {
    const res = await Conversation.find();
    return res;
}

async function getUserConversation(userId: string) {
    const res = await Conversation.aggregate([
        {
            $match: {
                members: {
                    $elemMatch: { id: userId }
                }
            }
        },
        {
            $lookup: {
                from: "messages",
                let: { id: "$id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$conversationId", "$$id"]
                            }
                        }
                    },
                    {
                        $match: {
                            deletedFor: {
                                $nin: [userId]
                            }
                        }
                    },
                    {
                        $project: {
                            deletedFor: 0
                        }
                    }
                ],
                as: "messages"
            }
        },
    ])

    return res;
}

async function updateConversationById(id: string, updates: Partial<IConversation>) {
    const res = await Conversation.findOneAndUpdate({ id }, updates)
    return res;
}

export default {
    createConversation,
    fetchAllConversations,
    getUserConversation,
    updateConversationById
}
