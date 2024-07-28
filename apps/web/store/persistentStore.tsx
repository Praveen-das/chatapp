import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'



interface IPersistentStoreContext {
    usersProfilePref: IUserRuleChangeRequest[]
    getUserProfilePref: (userId: string) => IProfilePref | null
    setUserProfilePref: (prefs: IUserRuleChangeRequest[]) => void
    updateUserProfilePref: (userId: string, pref: Partial<IProfilePref>) => void

    userNotificationPref: IUserNotificationPref
    setUserNotificationPref: (key: string, value: boolean) => void


    // setUserPref: (pref: IUserPref) => void,
    // getUserPref: (userId: string) => IUserPref,
    // updateUserPref: (userId: string, pref: IUserPref) => void,
}

const USER_PREF_DEFAULT: IProfilePref = {
    about: true,
    lastSeen: true,
    onlineStatus: true,
    profilePicture: true,
}

export const usePersistentStore = create(persist<IPersistentStoreContext>((set, get) => {
    return {
        usersProfilePref: [],
        getUserProfilePref: (userId) => {
            let usersProfilePref = get().usersProfilePref
            if(!usersProfilePref.length) return null
            
            let userPref = usersProfilePref.find(u => u.userId === userId)?.userPref || null

            return userPref
        },
        setUserProfilePref: (usersProfilePref) => set({ usersProfilePref }),
        updateUserProfilePref: (userId, pref) => {
            const usersProfilePref = get().usersProfilePref
            // const userProfilePref = usersProfilePref.find(u => u.userId === userId)

            // if (!userProfilePref) usersProfilePref.push({ userId, userPref: { ...USER_PREF_DEFAULT, ...pref } })
            // else usersProfilePref.map(u => u.userId === userId ? { ...u, userPref: { ...u.userPref, ...pref } } : u)

            console.log(usersProfilePref);
            
            // set(({ usersProfilePref }))
        },

        userNotificationPref: { chatNotification: true, groupNotification: true },
        setUserNotificationPref: (key, value) => set(s => ({ userNotificationPref: { ...s.userNotificationPref, [key]: value } }))

        // setUserPref: (pref) => set({ userProfilePrefs }),
        // getUserPref: (userId) => get().userProfilePrefs.find(c => c.userId === userId)!,
        // updateUserPref: (connection) => {
        //     const userProfilePrefs = get().userProfilePrefs.filter(c => c.userId !== connection.userId)
        //     userProfilePrefs.push(connection)
        //     set({ userProfilePrefs })
        // },
    }
}, {
    name: 'persistent-store', // name of the item in the storage (must be unique)
    // storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
},))
