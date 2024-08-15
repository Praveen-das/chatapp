'use client'

import React from 'react'
import { useStore } from '../../store/global'
import { AnimatePresence, motion } from 'framer-motion'
import GroupProfile from './GroupProfile'
import UserProfile from './UserProfile'
import motionconfig from '../../config/config'
import Tabs from '../Dashboard/Tabs/Tabs'
import Tab from '../Dashboard/Components/Tab'
import LinkManagement from './LinkManagement'
import UserMedia from './UserMedia'
import useSelectedConversation from '../../hooks/useSelectedConversation'

function DisplayProfile() {
  const profile = useStore(s => s.profile)
  const conversation = useSelectedConversation()
  const setProfileTab = useStore(s => s.setProfileTab)
  const selectedUser = useStore(s => s.selectedUser)
  const selectedGroup = useStore(s => s.selectedGroup)
  const users = useStore(s => s.users)

  const user = selectedUser || users.find(s => !s.self && conversation?.members.find(m => m.id === s.id))!

  const onExitComplete = () => {
    setProfileTab('')
  }

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {profile && <Component user={user} group={selectedGroup!} conversation={conversation!} />}
    </AnimatePresence>
  )
}

function Component({ user,group, conversation }: { user: IUser, group: IGroupConversation, conversation: IConversation }) {
  const profileTab = useStore(s => s.profileTab)
  
  return (
    <motion.div
      initial='hidden'
      animate='visible'
      exit='hidden'
      variants={motionconfig.profilDetails}
      className='relative'
    >
      <Tabs activeTab={profileTab} initialTab='conversation' direction='rtl'>
        <Tab component='conversation'>
          {conversation?.host === 'group' ?
            <GroupProfile conversation={conversation as IGroupConversation} /> :
            <UserProfile user={user!} />
          }
        </Tab>
        <Tab component='user'>
          <UserProfile user={user!} showChatOption />
        </Tab>
        <Tab component='group'>
          <GroupProfile conversation={group} /> :
        </Tab>
        <Tab component='inviteLink' >
          <LinkManagement selectedConversation={conversation as IGroupConversation} />
        </Tab>
        <Tab component='media'>
          <UserMedia conversation={conversation} />
        </Tab>
      </Tabs>
    </motion.div>
  )
}

export default DisplayProfile