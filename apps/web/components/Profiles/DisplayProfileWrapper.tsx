import React from 'react'

function DisplayProfileWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className={`flex-1 w-[calc((100vw/3)-2*1rem)] h-full flex flex-col bg-gradient-to-t from-base-200 rounded-2xl overflow-hidden`}>
            {children}
        </div>
    )
}

export default DisplayProfileWrapper