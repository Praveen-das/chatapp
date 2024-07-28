'use client'

import { createContext, useContext, useEffect, useState } from "react"

interface ITabProps extends ITabsContext { children: React.ReactNode }

interface ITabsContext {
    initialTab: string
    activeTab: string
    direction?: 'ltr' | 'rtl'
}

const Context = createContext<ITabsContext | null>(null)

function Tabs({ children, initialTab, activeTab, direction = 'ltr' }: ITabProps) {
    const values = { initialTab, activeTab: activeTab || initialTab, direction }
    return <Context.Provider value={values}>{children}</Context.Provider>
}

export const useTabs = () => {
    const context = useContext(Context)
    if (!context) throw new Error(`Context not found`);
    return context
}

export default Tabs