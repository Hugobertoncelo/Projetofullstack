'use client'

import { useState } from 'react'
import ConversationsList from './ConversationsListNew'
import ChatArea from './ChatAreaNew'
import UserProfile from './UserProfile'
import { useConversations } from '../../hooks/useConversations'
import { useAuth } from '../../hooks/useAuth'

export default function ChatLayout() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  const { user } = useAuth()
  const { conversations, isLoading, createDirectConversation } = useConversations()
  
  const selectedConversation = conversations.find(conv => conv.id === selectedConversationId)

  const handleStartNewConversation = async (userId: string) => {
    try {
      const newConversation = await createDirectConversation(userId)
      
      if (newConversation) {
        setSelectedConversationId(newConversation.id)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  return (
    <div className="flex h-screen animated-bg">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-500 ease-in-out modern-sidebar flex flex-col overflow-hidden`}>
        <UserProfile onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <ConversationsList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onStartNewConversation={handleStartNewConversation}
          isLoading={isLoading}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatArea 
          conversation={selectedConversation}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </div>
  )
}
