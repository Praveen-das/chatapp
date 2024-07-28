"use client"

import React, { createContext, useEffect, useRef, useState } from 'react'

export type IContext = ReturnType<typeof useContextData>

export const Context = createContext<IContext | null>(null)

const useContextData = () => {
    const [user, setUser] = useState<IUser | null>(null)
    const userRef = useRef<IUser | null>(null)

    useEffect(() => {
        (async () => {
            const _user = await getUser()

            userRef.current = _user
            setUser(_user)
        })()

        return () => {
            setUser(null)
        }
    }, [])

    const getUser = async () => {
        const _user: string | null = sessionStorage.getItem('user')

        let currentUser: IUser = _user && JSON.parse(_user)

        if (!_user) {
            const id = crypto.randomUUID()

            let body: IUser = {
                id,
                username: 'user_' + id.slice(0, 10),
                bio: '',
                profilePicture: '',
                lastSeen: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            }

            currentUser = await fetch(
                'http://localhost:4000/user',
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                .then(res => res.json())

            sessionStorage.setItem('user', JSON.stringify(currentUser))
        }

        return currentUser
    }

    const updateUser = (key: string, value: any) => {
        const updatedUser = { ...userRef.current!, [key]: value }
        setUser(updatedUser)
    }

    return {
        user,
        updateUser
    }
}

export default function AuthContext({ children }: { children: React.ReactNode }) {
    const value = useContextData()
    return <Context.Provider value={value}>{children}</Context.Provider>
}

