import axiosClient from "../lib/axiosClient";

export async function createChatGroup(data: IGroupCreationReq): Promise<IGroupConversation> {
    return await axiosClient.post('/group/create', data)
        .then(res => res.data)
        .catch(err => console.log("error----->createChatGroup", err.errors))
}
