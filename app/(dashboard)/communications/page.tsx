'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MOCK_CONVERSATIONS,
  type Conversation as MockConversation,
} from '@/components/communications/mock-data'
import { FilterBar } from '@/components/communications/FilterBar'
import { ConversationList } from '@/components/communications/ConversationList'
import { ThreadView } from '@/components/communications/ThreadView'
import { ComposeModal } from '@/components/communications/ComposeModal'
import type { Conversation as MockConv } from '@/components/communications/mock-data'

// ---------------------------------------------------------------------------
// Shape adapter: convert a Supabase conversations row to the mock Conversation
// shape so we can reuse all existing UI components unchanged.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptConversation(row: any, messages: MockConv['messages'] = []): MockConv {
  return {
    id: row.id,
    channel: row.channel ?? 'gmail',
    status: row.status ?? 'read',
    priority: row.priority ?? false,
    sender: {
      name: row.participant_name ?? row.participant_email ?? 'Unknown',
      email: row.participant_email ?? '',
    },
    subject: row.subject ?? '(no subject)',
    preview: messages[messages.length - 1]?.body?.slice(0, 120) ?? '',
    timestamp: row.last_message_at
      ? new Date(row.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    labels: row.labels ?? [],
    assignedTo: row.assigned_to ?? undefined,
    messages,
    aiSuggestedReply: undefined, // AI reply draft added in Phase 12
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptMessages(rows: any[]): MockConv['messages'] {
  return rows.map((m) => ({
    id: m.id,
    direction: m.direction,
    senderName: m.sender_name ?? m.sender_email ?? 'Unknown',
    senderEmail: m.sender_email ?? '',
    body: m.body_cached ?? m.body_preview ?? '',
    timestamp: m.received_at
      ? new Date(m.received_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '',
  }))
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunicationsPage() {
  const supabase = createClient()

  const [conversations, setConversations] = useState<MockConv[]>([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dismissedAI, setDismissedAI] = useState<Set<string>>(new Set())

  // Filters
  const [activeChannel, setActiveChannel] = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // Load conversations from Supabase
  // ---------------------------------------------------------------------------

  const loadConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    if (error || !data || data.length === 0) {
      // No real data yet — show mock data as placeholder
      setConversations(MOCK_CONVERSATIONS)
      setUsingMock(true)
      setLoading(false)
      return
    }

    const adapted = data.map((row) => adaptConversation(row))
    setConversations(adapted)
    setUsingMock(false)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ---------------------------------------------------------------------------
  // Realtime subscription — new messages push to the top
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (usingMock) return

    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => { loadConversations() }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as { conversation_id: string }
          // Refresh the affected conversation
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== newMsg.conversation_id) return c
              return { ...c, status: 'unread' }
            })
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, usingMock, loadConversations])

  // ---------------------------------------------------------------------------
  // Load messages for selected conversation
  // ---------------------------------------------------------------------------

  const loadMessages = useCallback(async (conversationId: string) => {
    if (usingMock) return // mock already has messages

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('received_at', { ascending: true })

    if (!data) return

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: adaptMessages(data) }
          : c
      )
    )
  }, [supabase, usingMock])

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------

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
        ) return false
      }
      return true
    })
  }, [conversations, activeChannel, activeStatus, priorityOnly, searchQuery])

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null
  const showAIPanel =
    !!selectedConversation?.aiSuggestedReply && !dismissedAI.has(selectedId ?? '')

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleSelect(id: string) {
    setSelectedId(id)

    if (!usingMock) {
      // Mark read in DB
      await supabase
        .from('conversations')
        .update({ status: 'read' })
        .eq('id', id)

      await loadMessages(id)
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === id && c.status === 'unread' ? { ...c, status: 'read' } : c
      )
    )
  }

  async function handleMarkUnread(id: string) {
    if (!usingMock) {
      await supabase
        .from('conversations')
        .update({ status: 'unread' })
        .eq('id', id)
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'unread' } : c))
    )
  }

  function handleDismissAI(id: string) {
    setDismissedAI((prev) => new Set([...prev, id]))
  }

  async function handleSendReply(id: string, text: string) {
    setDismissedAI((prev) => new Set([...prev, id]))

    if (!usingMock) {
      const conv = conversations.find((c) => c.id === id)
      if (conv) {
        await fetch('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: id,
            threadId: id, // external_id would be the real threadId in a full impl
            to: conv.sender.email,
            subject: conv.subject,
            replyBody: text,
          }),
        })
        await loadMessages(id)
      }
    }

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'replied' } : c))
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div
        style={{
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

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading inbox…</span>
          </div>
        ) : (
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
        )}
      </div>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
    </>
  )
}
