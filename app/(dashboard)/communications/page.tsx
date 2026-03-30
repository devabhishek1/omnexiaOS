'use client'

import React, { useState, useMemo } from 'react'
import { MOCK_CONVERSATIONS, type Conversation } from '@/components/communications/mock-data'
import { FilterBar } from '@/components/communications/FilterBar'
import { ConversationList } from '@/components/communications/ConversationList'
import { ThreadView } from '@/components/communications/ThreadView'
import { ComposeModal } from '@/components/communications/ComposeModal'

export default function CommunicationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dismissedAI, setDismissedAI] = useState<Set<string>>(new Set())

  // Filters
  const [activeChannel, setActiveChannel] = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)

  // Filtered list
  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (activeChannel !== 'all' && c.channel !== activeChannel) return false
      if (activeStatus !== 'all' && c.status !== activeStatus) return false
      if (priorityOnly && !c.priority) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !c.sender.name.toLowerCase().includes(q) &&
          !c.subject.toLowerCase().includes(q) &&
          !c.preview.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [conversations, activeChannel, activeStatus, priorityOnly, searchQuery])

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null
  const showAIPanel =
    !!selectedConversation?.aiSuggestedReply && !dismissedAI.has(selectedId ?? '')

  function handleSelect(id: string) {
    setSelectedId(id)
    // Mark as read on open (read dot disappears)
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id && c.status === 'unread' ? { ...c, status: 'read' } : c
      )
    )
  }

  function handleMarkUnread(id: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'unread' } : c))
    )
  }

  function handleDismissAI(id: string) {
    setDismissedAI((prev) => new Set([...prev, id]))
  }

  function handleSendReply(id: string, _text: string) {
    setDismissedAI((prev) => new Set([...prev, id]))
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'replied' } : c))
    )
  }

  return (
    <>
      <div
        style={{
          // Break out of dashboard's 28px padding
          margin: '-28px',
          height: 'calc(100vh - 56px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-base)',
        }}
      >
        <FilterBar
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          activeStatus={activeStatus}
          setActiveStatus={setActiveStatus}
          priorityOnly={priorityOnly}
          setPriorityOnly={setPriorityOnly}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onCompose={() => setComposeOpen(true)}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ConversationList
            conversations={filtered}
            allEmpty={conversations.length === 0}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
          <ThreadView
            conversation={selectedConversation}
            showAIPanel={showAIPanel}
            priorityOnly={priorityOnly}
            onDismissAI={handleDismissAI}
            onSendReply={handleSendReply}
            onMarkUnread={handleMarkUnread}
          />
        </div>
      </div>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
    </>
  )
}
