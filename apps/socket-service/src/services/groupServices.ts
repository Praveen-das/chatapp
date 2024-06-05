import axiosClient from "../lib/axiosClient";

export async function createChatGroup(data: IGroupConversation): Promise<IGroup> {
    return await axiosClient.post('/group/create', data)
        .then(res => res.data)
        .catch(err => console.log("error----->createChatGroup", err.errors))
}
