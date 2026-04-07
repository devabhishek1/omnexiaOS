'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { FilterBar } from '@/components/communications/FilterBar'
import { ConversationList } from '@/components/communications/ConversationList'
import { ThreadView } from '@/components/communications/ThreadView'
import { ComposeModal } from '@/components/communications/ComposeModal'
import type { Conversation } from '@/components/communications/mock-data'

// ---------------------------------------------------------------------------
// Adapt decrypted API rows → Conversation shape
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptConversation(row: any, messages: Conversation['messages'] = [], teamMembers: TeamMember[] = []): Conversation {
  let assignedToName: string | undefined
  if (row.assignedTo) {
    const member = teamMembers.find((m) => m.id === row.assignedTo)
    assignedToName = member?.fullName ?? row.assignedTo
  }
  return {
    id: row.id,
    externalId: row.externalId,
    channel: row.channel ?? 'gmail',
    status: row.status ?? 'read',
    priority: row.priority ?? false,
    sender: {
      name: row.participantName ?? row.participantEmail ?? 'Unknown',
      email: row.participantEmail ?? '',
    },
    subject: row.subject ?? '(no subject)',
    preview: messages[messages.length - 1]?.body?.slice(0, 120) ?? '',
    timestamp: row.lastMessageAt
      ? new Date(row.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    lastMessageAt: row.lastMessageAt ?? undefined,
    labels: row.labels ?? [],
    assignedTo: assignedToName,
    assignedToId: row.assignedTo ?? undefined,
    isArchived: row.isArchived ?? false,
    folder: row.folder ?? 'inbox',
    messages,
    aiSuggestedReply: undefined,
  }
}

interface TeamMember {
  id: string
  fullName: string
  email: string
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CommunicationsPage() {
  const t = useTranslations('communications')
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [businessName, setBusinessName] = useState('Your Business')
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dismissedAI, setDismissedAI] = useState<Set<string>>(new Set())

  // Resizable panel
  const [listWidth, setListWidth] = useState(320)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(320)
  // Track which conversations have already been fully synced this session
  const syncedConvIds = useRef<Set<string>>(new Set())

  // Filters
  const [activeChannel, setActiveChannel] = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')
  const [activeFolder, setActiveFolder] = useState('inbox')
  const [activeLabel, setActiveLabel] = useState('')
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // ---------------------------------------------------------------------------
  // Load business name + user info
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function loadMeta() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserEmail(user.email ?? '')
      setCurrentUserId(user.id)

      const { data: userRow } = await supabase
        .from('users')
        .select('business_id, full_name')
        .eq('id', user.id)
        .single()

      if (userRow?.business_id) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', userRow.business_id)
          .single()
        if (biz?.name) setBusinessName(biz.name)

        // Load team members with communications module access
        const { data: members } = await supabase
          .from('users')
          .select('id, full_name, email, module_access')
          .eq('business_id', userRow.business_id)
          .eq('status', 'active')
        if (members) {
          setTeamMembers(
            members
              .filter((m) => {
                // admins always have access; others need module_access.communications
                const ma = m.module_access as Record<string, boolean> | null
                return ma === null || ma?.communications !== false
              })
              .map((m) => ({
                id: m.id,
                fullName: m.full_name ?? m.email,
                email: m.email,
              }))
          )
        }
      }
    }
    loadMeta()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Load conversations
  // ---------------------------------------------------------------------------

  const loadConversations = useCallback(async (members?: TeamMember[]) => {
    const res = await fetch('/api/gmail/conversations')
    if (!res.ok) { setLoading(false); return }
    const { conversations: rows } = await res.json()
    const unique = Array.from(new Map((rows ?? []).map((r: { id: string }) => [r.id, r])).values())
    // Preserve already-loaded messages so Realtime reloads don't wipe thread contents
    setConversations((prev) => {
      const existing = new Map(prev.map((c) => [c.id, c.messages]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return unique.map((row: any) => adaptConversation(row, existing.get(row.id) ?? [], members))
    })
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // ---------------------------------------------------------------------------
  // Realtime
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel('comms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as { conversation_id: string; received_at: string; direction: string }
        const now = msg.received_at ?? new Date().toISOString()
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === msg.conversation_id
              ? {
                  ...c,
                  status: msg.direction === 'inbound' ? ('unread' as const) : c.status,
                  lastMessageAt: now,
                  timestamp: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }
              : c
          )
          // Re-sort by lastMessageAt descending so the updated conversation rises to the top
          return [...updated].sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
            return bTime - aTime
          })
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, loadConversations])

  // ---------------------------------------------------------------------------
  // Load messages for selected conversation
  // ---------------------------------------------------------------------------

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/gmail/messages?conversationId=${conversationId}`)
    if (!res.ok) { setMessagesLoading(false); return }
    const { messages } = await res.json()
    if (!messages) { setMessagesLoading(false); return }
    setConversations((prev) =>
      prev.map((c) => c.id === conversationId ? { ...c, messages } : c)
    )
    setMessagesLoading(false)
  }, [])

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      // Folder filter — 'archive' shows is_archived, others filter by folder value
      if (activeFolder === 'archive') {
        if (!c.isArchived) return false
      } else {
        if (c.isArchived) return false
        if (activeFolder !== 'inbox' && c.folder !== activeFolder) return false
      }
      if (activeChannel !== 'all' && c.channel !== activeChannel) return false
      if (activeStatus !== 'all' && c.status !== activeStatus) return false
      if (priorityOnly && !c.priority) return false
      if (mineOnly && c.assignedToId !== currentUserId) return false
      if (activeLabel && !c.labels?.includes(activeLabel)) return false
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
  }, [conversations, activeChannel, activeStatus, activeFolder, activeLabel, priorityOnly, mineOnly, searchQuery, currentUserId])

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null
  const showAIPanel = !!selectedConversation?.aiSuggestedReply && !dismissedAI.has(selectedId ?? '')

  // ---------------------------------------------------------------------------
  // Resize panel — global mouse events
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const next = Math.max(240, Math.min(520, startWidth.current + delta))
      setListWidth(next)
    }
    function onMouseUp() {
      if (dragging.current) {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/gmail/initial-sync', { method: 'POST' })
      await loadConversations()
    } catch { /* non-fatal */ }
    setSyncing(false)
  }

  async function handleGmailConnected(_email: string) {
    // Trigger initial sync after Gmail is connected
    try {
      await fetch('/api/gmail/initial-sync', { method: 'POST' })
      await loadConversations()
    } catch {
      // non-fatal
    }
  }

  async function handleSelect(id: string) {
    setSelectedId(id)
    setMessagesLoading(true)
    await supabase.from('conversations').update({ status: 'read' }).eq('id', id)
    setConversations((prev) =>
      prev.map((c) => c.id === id && c.status === 'unread' ? { ...c, status: 'read' } : c)
    )
    await loadMessages(id)
    // Background: fetch full Gmail thread history — only once per session per conversation
    if (!syncedConvIds.current.has(id)) {
      syncedConvIds.current.add(id)
      fetch('/api/gmail/sync-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      }).then(() => loadMessages(id)).catch(() => { /* non-fatal */ })
    }
  }

  async function handleMarkUnread(id: string) {
    await supabase.from('conversations').update({ status: 'unread' }).eq('id', id)
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, status: 'unread' } : c))
  }

  async function handleAssign(id: string, memberId: string | null) {
    await supabase.from('conversations').update({ assigned_to: memberId }).eq('id', id)
    const member = teamMembers.find((m) => m.id === memberId)
    setConversations((prev) => prev.map((c) =>
      c.id === id ? { ...c, assignedToId: memberId ?? undefined, assignedTo: member?.fullName ?? undefined } : c
    ))
  }

  async function handleLabel(id: string, label: string) {
    const conv = conversations.find((c) => c.id === id)
    if (!conv) return
    const current = conv.labels ?? []
    const next = current.includes(label) ? current.filter((l) => l !== label) : [...current, label]
    await supabase.from('conversations').update({ labels: next }).eq('id', id)
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, labels: next } : c))
  }

  async function handleArchive(id: string) {
    await supabase.from('conversations').update({ is_archived: true }).eq('id', id)
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, isArchived: true } : c))
    // Deselect if currently open
    if (selectedId === id) setSelectedId(null)
  }

  async function handleDelete(id: string) {
    await supabase.from('conversations').delete().eq('id', id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  async function handleMoveToFolder(id: string, folder: string) {
    await supabase.from('conversations').update({ folder, is_archived: folder === 'archive' }).eq('id', id)
    setConversations((prev) => prev.map((c) =>
      c.id === id ? { ...c, folder, isArchived: folder === 'archive' } : c
    ))
    if (selectedId === id) setSelectedId(null)
  }

  function handleDismissAI(id: string) {
    setDismissedAI((prev) => new Set([...prev, id]))
  }

  async function handleSendReply(id: string, text: string, files?: File[]) {
    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      if (files && files.length > 0) {
        const fd = new FormData()
        fd.append('conversationId', id)
        fd.append('threadId', conv.externalId ?? '')
        fd.append('to', conv.sender.email)
        fd.append('subject', conv.subject)
        fd.append('replyBody', text)
        for (const f of files) fd.append('attachments', f)
        await fetch('/api/gmail/send', { method: 'POST', body: fd })
      } else {
        await fetch('/api/gmail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: id,
            threadId: conv.externalId,
            to: conv.sender.email,
            subject: conv.subject,
            replyBody: text,
          }),
        })
      }
      await loadMessages(id)
    }
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, status: 'replied' } : c))
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
          background: '#F9F9F6',
        }}
      >
        <FilterBar
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          activeStatus={activeStatus}
          setActiveStatus={setActiveStatus}
          activeFolder={activeFolder}
          setActiveFolder={setActiveFolder}
          activeLabel={activeLabel}
          setActiveLabel={setActiveLabel}
          priorityOnly={priorityOnly}
          setPriorityOnly={setPriorityOnly}
          mineOnly={mineOnly}
          setMineOnly={setMineOnly}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onCompose={() => setComposeOpen(true)}
          onSync={handleSync}
          syncing={syncing}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <ConversationList
            conversations={filtered}
            allEmpty={conversations.length === 0}
            loading={loading}
            selectedId={selectedId}
            onSelect={handleSelect}
            onGmailConnected={handleGmailConnected}
            width={listWidth}
          />
          {/* Drag handle */}
          <div
            onMouseDown={(e) => {
              dragging.current = true
              startX.current = e.clientX
              startWidth.current = listWidth
              document.body.style.cursor = 'col-resize'
              document.body.style.userSelect = 'none'
            }}
            style={{
              width: '4px',
              flexShrink: 0,
              background: 'var(--border-default)',
              cursor: 'col-resize',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--omnexia-accent)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--border-default)' }}
          />
          <ThreadView
            conversation={selectedConversation}
            showAIPanel={showAIPanel}
            priorityOnly={priorityOnly}
            businessName={businessName}
            currentUserEmail={currentUserEmail}
            currentUserId={currentUserId}
            teamMembers={teamMembers}
            messagesLoading={messagesLoading}
            onDismissAI={handleDismissAI}
            onSendReply={handleSendReply}
            onMarkUnread={handleMarkUnread}
            onAssign={handleAssign}
            onLabel={handleLabel}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onMoveToFolder={handleMoveToFolder}
          />
        </div>
      </div>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} onSent={loadConversations} />}
    </>
  )
}
