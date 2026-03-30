'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/communications/FilterBar'
import { ConversationList } from '@/components/communications/ConversationList'
import { ThreadView } from '@/components/communications/ThreadView'
import { ComposeModal } from '@/components/communications/ComposeModal'
import type { Conversation } from '@/components/communications/mock-data'

// ---------------------------------------------------------------------------
// Adapt Supabase rows → Conversation shape used by UI components
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptMessages(rows: any[]): Conversation['messages'] {
  return rows.map((m) => ({
    id: m.id,
    direction: m.direction,
    senderName: m.sender_name ?? m.sender_email ?? 'Unknown',
    senderEmail: m.sender_email ?? '',
    body: m.body_cached ?? m.body_preview ?? '',
    timestamp: m.received_at
      ? new Date(m.received_at).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptConversation(row: any, messages: Conversation['messages'] = []): Conversation {
  const lastMsg = messages[messages.length - 1]
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
    preview: lastMsg?.body?.slice(0, 120) ?? '',
    timestamp: row.last_message_at
      ? new Date(row.last_message_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    labels: row.labels ?? [],
    assignedTo: row.assigned_to ?? undefined,
    messages,
    aiSuggestedReply: undefined, // wired in Phase 12
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunicationsPage() {
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dismissedAI, setDismissedAI] = useState<Set<string>>(new Set())

  const [activeChannel, setActiveChannel] = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // Load conversations
  // ---------------------------------------------------------------------------

  const loadConversations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    setConversations((data ?? []).map((row) => adaptConversation(row)))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ---------------------------------------------------------------------------
  // Realtime — conversations and messages
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel('comms-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadConversations()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as { conversation_id: string }
          setConversations((prev) =>
            prev.map((c) =>
              c.id === msg.conversation_id ? { ...c, status: 'unread' } : c
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadConversations])

  // ---------------------------------------------------------------------------
  // Load messages for selected conversation
  // ---------------------------------------------------------------------------

  const loadMessages = useCallback(
    async (conversationId: string) => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('received_at', { ascending: true })

      if (!data) return

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, messages: adaptMessages(data) } : c
        )
      )
    },
    [supabase]
  )

  // ---------------------------------------------------------------------------
  // Filtering
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
        )
          return false
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

    await supabase.from('conversations').update({ status: 'read' }).eq('id', id)

    setConversations((prev) =>
      prev.map((c) => (c.id === id && c.status === 'unread' ? { ...c, status: 'read' } : c))
    )

    await loadMessages(id)
  }

  async function handleMarkUnread(id: string) {
    await supabase.from('conversations').update({ status: 'unread' }).eq('id', id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'unread' } : c))
    )
  }

  function handleDismissAI(id: string) {
    setDismissedAI((prev) => new Set([...prev, id]))
  }

  async function handleSendReply(id: string, text: string) {
    setDismissedAI((prev) => new Set([...prev, id]))

    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: id,
          threadId: id,
          to: conv.sender.email,
          subject: conv.subject,
          replyBody: text,
        }),
      })
      await loadMessages(id)
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
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading inbox…
            </span>
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
