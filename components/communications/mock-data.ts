export type ConversationChannel = 'gmail' | 'instagram' | 'facebook'
export type ConversationStatus = 'unread' | 'read' | 'replied' | 'pending'

export interface MessageAttachment {
  filename: string
  mimeType: string
  attachmentId: string
  gmailMessageId: string
}

export interface ThreadMessage {
  id: string
  direction: 'inbound' | 'outbound'
  senderName: string
  senderEmail: string
  body: string
  timestamp: string
  attachments?: MessageAttachment[]
}

export interface Conversation {
  id: string
  externalId?: string  // Gmail threadId (used for sending replies in-thread)
  channel: ConversationChannel
  status: ConversationStatus
  priority: boolean
  sender: { name: string; email: string }
  subject: string
  preview: string
  timestamp: string
  labels: string[]
  assignedTo?: string
  messages: ThreadMessage[]
  aiSuggestedReply?: string
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    channel: 'gmail',
    status: 'unread',
    priority: true,
    sender: { name: 'Thomas Müller', email: 'thomas.muller@eurotech.de' },
    subject: 'RE: Invoice #1042 — Payment query',
    preview: "I'm writing regarding invoice #1042. The amount seems incorrect…",
    timestamp: '2m',
    labels: ['Invoice'],
    messages: [
      {
        id: 'm1-1',
        direction: 'outbound',
        senderName: 'You',
        senderEmail: 'hello@leaxudor.fr',
        body: 'Dear Thomas,\n\nPlease find attached invoice #1042 for services rendered in March. The total amount due is €4,800 (excl. VAT). Payment is due within 30 days.\n\nBest regards,\nLeaxuDor Team',
        timestamp: 'Mar 26, 10:00 AM',
      },
      {
        id: 'm1-2',
        direction: 'inbound',
        senderName: 'Thomas Müller',
        senderEmail: 'thomas.muller@eurotech.de',
        body: "Hi,\n\nI'm writing regarding invoice #1042 dated March 26th. The amount of €4,800 seems incorrect — we agreed on a 10% loyalty discount during our last call, which would bring the total to €4,320.\n\nCould you please review and issue a corrected invoice? Our accounts payable team is processing March payments this week.\n\nThank you,\nThomas Müller",
        timestamp: 'Today, 9:14 AM',
      },
    ],
    aiSuggestedReply:
      "Dear Thomas,\n\nThank you for flagging this. You are absolutely correct — I've reviewed your account and can confirm the 10% loyalty discount was agreed during our call on March 20th. I sincerely apologize for the oversight.\n\nI will issue corrected invoice #1042-R today with the adjusted amount of €4,320. You should receive it within the hour.\n\nBest regards,",
  },
  {
    id: 'conv-2',
    channel: 'gmail',
    status: 'unread',
    priority: false,
    sender: { name: 'Sophie Martin', email: 'sophie.martin@agencecreative.fr' },
    subject: 'Q2 Partnership Proposal',
    preview: "I represent Agence Créative Sud and we're very interested in exploring…",
    timestamp: '14m',
    labels: ['Partnership'],
    messages: [
      {
        id: 'm2-1',
        direction: 'inbound',
        senderName: 'Sophie Martin',
        senderEmail: 'sophie.martin@agencecreative.fr',
        body: "Hello,\n\nI represent Agence Créative Sud, a digital agency based in Lyon with clients across France and Belgium. After researching your platform, I'm very interested in exploring a long-term partnership for Q2 2025.\n\nWe manage communications and billing for 40+ SMB clients and believe your platform could significantly streamline our workflow. I'd love to discuss reseller pricing or a white-label arrangement.\n\nWould you be available for a 30-minute call next week?\n\nBest regards,\nSophie Martin\nHead of Partnerships",
        timestamp: 'Today, 8:52 AM',
      },
    ],
    aiSuggestedReply:
      "Dear Sophie,\n\nThank you for reaching out — your timing is excellent, as we're actively expanding our partner program.\n\nAgence Créative Sud sounds like a great fit and I'd love to explore a reseller or white-label arrangement. I'm available for a call next week — Tuesday and Thursday afternoons work well.\n\nPlease reply with your preferred time and I'll send a calendar invite.\n\nLooking forward to speaking soon,",
  },
  {
    id: 'conv-3',
    channel: 'gmail',
    status: 'replied',
    priority: false,
    sender: { name: 'Antoine Dupont', email: 'a.dupont@distribpro.fr' },
    subject: 'Spring Collection — Delivery Update',
    preview: "Thank you! That's exactly what I needed. See you on April 3rd.",
    timestamp: '1h',
    labels: [],
    messages: [
      {
        id: 'm3-1',
        direction: 'inbound',
        senderName: 'Antoine Dupont',
        senderEmail: 'a.dupont@distribpro.fr',
        body: 'Hello,\n\nCould you please confirm when the Spring collection delivery is expected? We need to plan our warehouse space.\n\nThank you,\nAntoine',
        timestamp: 'Yesterday, 3:45 PM',
      },
      {
        id: 'm3-2',
        direction: 'outbound',
        senderName: 'You',
        senderEmail: 'hello@leaxudor.fr',
        body: "Hi Antoine,\n\nThe Spring collection is scheduled for delivery on April 3rd, between 9am and 1pm. You'll receive a tracking number 48 hours before.\n\nBest regards",
        timestamp: 'Yesterday, 4:20 PM',
      },
      {
        id: 'm3-3',
        direction: 'inbound',
        senderName: 'Antoine Dupont',
        senderEmail: 'a.dupont@distribpro.fr',
        body: "Thank you! That's exactly what I needed. We'll have the team ready. See you on April 3rd.",
        timestamp: 'Yesterday, 5:02 PM',
      },
    ],
  },
  {
    id: 'conv-4',
    channel: 'gmail',
    status: 'unread',
    priority: true,
    sender: { name: 'Carlos García', email: 'carlos@modaiberica.es' },
    subject: 'URGENT: Order system down — losing sales',
    preview: 'Our order processing system has been unresponsive for 2 hours…',
    timestamp: '3h',
    labels: ['Urgent', 'Support'],
    messages: [
      {
        id: 'm4-1',
        direction: 'inbound',
        senderName: 'Carlos García',
        senderEmail: 'carlos@modaiberica.es',
        body: 'Hello,\n\nThis is URGENT. Our order processing system has been completely unresponsive for the past 2 hours. Customers cannot place orders and we estimate losses of €8,000+ so far.\n\nThis is a critical Saturday — our biggest traffic day — and this is completely unacceptable. We need this resolved IMMEDIATELY.\n\nCarlos García\nCEO, Moda Ibérica SL',
        timestamp: 'Today, 6:55 AM',
      },
    ],
    aiSuggestedReply:
      "Dear Carlos,\n\nI sincerely apologize for this critical disruption and fully understand the urgency. This is our absolute top priority right now.\n\nOur technical team has been immediately alerted and is actively investigating. We are treating this as a P0 incident.\n\nI will provide you with a personal update every 30 minutes until this is fully resolved. Please do not hesitate to call me directly if needed.\n\nThank you for your patience.",
  },
  {
    id: 'conv-5',
    channel: 'gmail',
    status: 'pending',
    priority: false,
    sender: { name: 'Laura Bianchi', email: 'l.bianchi@studiolegale.it' },
    subject: 'Service Agreement — Final Review Required',
    preview: 'Please find attached the final version of the service agreement…',
    timestamp: 'Yesterday',
    labels: ['Legal', 'Contract'],
    assignedTo: 'You',
    messages: [
      {
        id: 'm5-1',
        direction: 'inbound',
        senderName: 'Laura Bianchi',
        senderEmail: 'l.bianchi@studiolegale.it',
        body: 'Dear team,\n\nPlease find attached the final version of the service agreement between Studio Legale Bianchi & Partners and LeaxuDor SAS. Our legal team has incorporated all the amendments discussed on March 25th.\n\nWe require signatures by March 31st to proceed with the Q2 engagement.\n\nKind regards,\nLaura Bianchi',
        timestamp: 'Yesterday, 11:30 AM',
      },
      {
        id: 'm5-2',
        direction: 'outbound',
        senderName: 'You',
        senderEmail: 'hello@leaxudor.fr',
        body: 'Dear Laura,\n\nThank you for sending the final agreement. We are reviewing the document with our legal counsel and will revert by end of week.\n\nBest regards',
        timestamp: 'Yesterday, 2:15 PM',
      },
    ],
  },
  {
    id: 'conv-6',
    channel: 'gmail',
    status: 'read',
    priority: false,
    sender: { name: 'Emma Van Der Berg', email: 'emma.vdberg@retailnl.nl' },
    subject: 'Q1 Review Meeting — Reschedule Request',
    preview: "No problem at all! Friday at 10am works perfectly. Looking forward…",
    timestamp: 'Mar 28',
    labels: [],
    messages: [
      {
        id: 'm6-1',
        direction: 'inbound',
        senderName: 'Emma Van Der Berg',
        senderEmail: 'emma.vdberg@retailnl.nl',
        body: 'Hi,\n\nI need to reschedule our Q1 review meeting from Thursday March 27th to Friday March 28th, if possible. We have an unexpected board meeting that has come up.\n\nApologies for the short notice.\n\nEmma',
        timestamp: 'Mar 27, 9:00 AM',
      },
      {
        id: 'm6-2',
        direction: 'outbound',
        senderName: 'You',
        senderEmail: 'hello@leaxudor.fr',
        body: 'Hi Emma,\n\nNo problem at all! Friday March 28th at 10am works perfectly for us. I\'ve updated the calendar invite accordingly.\n\nLooking forward to the review.\n\nBest regards',
        timestamp: 'Mar 27, 9:45 AM',
      },
    ],
  },
  {
    id: 'conv-7',
    channel: 'instagram',
    status: 'unread',
    priority: false,
    sender: { name: '@boutique_lyonnaise', email: 'instagram:boutique_lyonnaise' },
    subject: 'Product availability enquiry',
    preview: 'Bonjour! Vous avez ce produit en bleu? Taille M?',
    timestamp: 'Mar 27',
    labels: ['Product'],
    messages: [
      {
        id: 'm7-1',
        direction: 'inbound',
        senderName: '@boutique_lyonnaise',
        senderEmail: 'instagram:boutique_lyonnaise',
        body: 'Bonjour! Vous avez ce produit en bleu? Taille M? Je suis très intéressée par votre nouvelle collection.',
        timestamp: 'Mar 27, 2:30 PM',
      },
    ],
    aiSuggestedReply:
      'Bonjour ! Merci pour votre message. Oui, nous avons ce produit disponible en bleu, tailles S à XL, y compris le M. Souhaitez-vous passer commande ou en savoir plus sur la collection ? Notre équipe est disponible pour vous aider !',
  },
  {
    id: 'conv-8',
    channel: 'facebook',
    status: 'read',
    priority: false,
    sender: { name: 'Jean-Philippe Leclerc', email: 'facebook:jp.leclerc' },
    subject: 'Store opening hours question',
    preview: 'Hi Jean-Philippe! We are open on Sundays from 10am to 6pm.',
    timestamp: 'Mar 26',
    labels: [],
    messages: [
      {
        id: 'm8-1',
        direction: 'inbound',
        senderName: 'Jean-Philippe Leclerc',
        senderEmail: 'facebook:jp.leclerc',
        body: "Bonjour, je voulais savoir quels sont vos horaires d'ouverture le dimanche? Merci d'avance.",
        timestamp: 'Mar 26, 11:00 AM',
      },
      {
        id: 'm8-2',
        direction: 'outbound',
        senderName: 'You',
        senderEmail: 'hello@leaxudor.fr',
        body: "Bonjour Jean-Philippe ! Nous sommes ouverts le dimanche de 10h à 18h. N'hésitez pas à nous contacter si vous avez d'autres questions. À bientôt !",
        timestamp: 'Mar 26, 11:30 AM',
      },
    ],
  },
]
