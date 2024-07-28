import axiosClient from "../lib/axiosClient";

export async function findUserGroups(userId: string): Promise<IGroupConversation[]> {
    return await axiosClient(`/group/${userId}`)
        .then(res => res.data)
        .catch(err => {
            console.log("findUserGroups------------>", err.errors)
            return []
        });
}

export async function findUserConversations(userId: string): Promise<IConversation[]> {
    return await axiosClient(`/conversation/${userId}`)
        .then(res => res.data)
        .catch(err => {
            console.log("findUserConversations----------------->", err.errors)
            return []
        });
}

export async function getAllContacts(): Promise<IUser[]> {
    return await axiosClient(`/user`)
        .then(res => res.data)
        .catch(err => {
            console.log("getAllContacts----------------->", err.errors)
            return []
        });
}

export async function findUserMessages(userId: string): Promise<IArrayMap> {
    return await axiosClient(`/messages?userId=${userId}`)
        .then(res => res.data)
        .catch(err => {
            console.log(err.errors)
        });
}


