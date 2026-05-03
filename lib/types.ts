export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'AGENT'
  companyId: string
}

export interface Company {
  id: string
  name: string
}

export interface Assistant {
  id: string
  name: string
  instructions: string | null
  isActive: boolean
}

export interface Contact {
  id: string
  name: string | null
  phone: string
  email: string | null
  createdAt: string
}

export interface Conversation {
  id: string
  contactId: string
  status: 'OPEN' | 'CLOSED'
  aiEnabled: boolean
  source: string | null
  campaign: string | null
  createdAt: string
  updatedAt: string
  contact: Contact
  humanTakeovers?: HumanTakeover[]
  _count?: { messages: number }
}

export interface Message {
  id: string
  conversationId: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderType: 'CONTACT' | 'HUMAN' | 'AI' | 'SYSTEM'
  content: string
  createdAt: string
}

export interface HumanTakeover {
  id: string
  conversationId: string
  userId: string
  reason: string | null
  endedAt: string | null
  createdAt: string
}

export interface WhatsappConnection {
  id: string
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
  phoneNumber: string | null
  evolutionInstanceName: string | null
  qrCode: string | null
  updatedAt: string
}

export interface DashboardStats {
  company: { id: string; name: string }
  assistant: Assistant | null
  stats: { users: number; contacts: number; conversations: number }
}

export interface KnowledgeBase {
  id: string
  title: string
  content: string | null
  fileUrl: string | null
  createdAt: string
}
