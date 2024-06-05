"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

interface Props {
    children: React.ReactNode
}

interface IContext {
    user: {
        id: string
        username: string
        blockedUsers: string[]
    } | null
    addUserToBlockedList: (userId: string) => void
    removeUserFromBlockedList: (userId: string) => void
}

const Context = createContext<IContext | null>(null)

export const useAuth = () => {
    const state = useContext(Context)
    if (!state) throw new Error(`Context not found`)

    return state
}

const getUser = () => {
    const _user: string | null = sessionStorage.getItem('user')
    let user: IContext['user'] = _user && JSON.parse(_user)

    if (!_user) {
        const id = crypto.randomUUID()
        user = {
            id,
            username: 'user_' + id.slice(0, 10),
            blockedUsers: []
        }
        sessionStorage.setItem('user', JSON.stringify(user))
    }

    return user
}

export default function AuthContext({ children }: Props) {
    const [user, setUser] = useState<IContext['user']>(null)

    useEffect(() => {
        const _user = getUser()
        setUser(_user)

        return () => {
            setUser(null)
        }
    }, [])

    const addUserToBlockedList = (conversationId: string) => {
        setUser(_user => {
            if (!_user) return null
            const data = {
                ..._user,
                blockedUsers: _user.blockedUsers && [..._user.blockedUsers, conversationId]
            }
            return data
        })
    }

    const removeUserFromBlockedList = (conversationId: string) => {
        setUser(_user => {
            if (!_user) return null
            return { ..._user, blockedUsers: _user.blockedUsers?.filter((cId) => conversationId !== cId) }
        })
    }

    const values = {
        user,
        addUserToBlockedList,
        removeUserFromBlockedList
    }

    return (
        <Context.Provider value={values}>
            {children}
        </Context.Provider>
    )
}
