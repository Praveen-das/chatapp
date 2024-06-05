import React from 'react'
import ConversationPanel from '../components/ConversationPanel/ConversationPanel'
import Navbar from '../components/Navbar/Navbar'
import Messenger from '../components/Messenger/Messenger'

export default function page() {
  return (
    <div className='flex w-full gap-4 p-4 h-screen bg-zinc-900'>
      {/* <Navbar /> */}
      <ConversationPanel />
      <Messenger />
    </div>
  )
}

