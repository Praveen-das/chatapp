import React from 'react'

function AdminTag({ isAdmin = false }: { isAdmin: boolean }) {
    return (
        <div>
            {isAdmin && <span className="text-[10px] bg-black/30 px-2 py-1 rounded-lg whitespace-nowrap" >Admin</span>}
        </div>
    )
}

export default AdminTag