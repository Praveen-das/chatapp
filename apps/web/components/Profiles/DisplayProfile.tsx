'use client'

import React, { useEffect } from 'react'
import { useStore } from '../../store/global'
import { AnimatePresence, motion } from 'framer-motion'
import GroupProfile from './GroupProfile'
import UserProfile from './UserProfile'
import motionconfig from '../../config/config'
import { useConversationStore } from '../../store/conversationStore'
import Tabs from '../Dashboard/Tabs/Tabs'
import Tab from '../Dashboard/Components/Tab'
import LinkManagement from './LinkManagement'
import UserMedia from './UserMedia'
import useSelectedConversation from '../../hooks/useSelectedConversation'

function DisplayProfile() {
  const profile = useStore(s => s.profile)
  const profileTab = useStore(s => s.profileTab)

  const users = useStore(s => s.users)
  const selectedUser = useStore(s => s.selectedUser)
  const selectedConversation = useSelectedConversation()

  const user = selectedUser || users.find(s => !s.self && selectedConversation?.members.find(m => m.id === s.id))!

  return (
    <AnimatePresence>
      {profile &&
        <motion.div
          initial='hidden'
          animate='visible'
          exit='hidden'
          variants={motionconfig.profilDetails}
          className='relative'
        >
          {selectedConversation?.host === 'group' ?
            <Tabs activeTab={profileTab} initialTab='group' direction='rtl'>
              <Tab component='group'>
                <GroupProfile conversation={selectedConversation as IGroupConversation} />
              </Tab>
              <Tab component='user'>
                <UserProfile user={user} asd />
              </Tab>
              <Tab component='inviteLink'>
                <LinkManagement />
              </Tab>
              <Tab component='media'>
                <UserMedia />
              </Tab>
            </Tabs>
            :
            <Tabs activeTab={profileTab} initialTab='user' direction='rtl'>
              <Tab component='user'>
                <UserProfile user={user} />
              </Tab>
              <Tab component='group'>
                <GroupProfile conversation={selectedConversation as IGroupConversation} />
              </Tab>
              <Tab component='media'>
                <UserMedia />
              </Tab>
            </Tabs>
          }
        </motion.div>
      }
    </AnimatePresence>
  )
}

export default DisplayProfile