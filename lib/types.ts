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
  user?: { id: string; name: string; email: string }
}

export interface WhatsappConnection {
  id: string
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
  phoneNumber: string | null
  evolutionInstanceName: string | null
  qrCode: string | null
  updatedAt: string
}

export interface Entitlements {
  ai: boolean
  whatsapp: boolean
  karisLink: boolean
  modules: Record<string, any>
}

export interface DashboardStats {
  company: {
    id: string
    name: string
    aiEnabled: boolean
    whatsappEnabled: boolean
    karisLinkEnabled: boolean
    subscription: CompanySubscription | null
    entitlements: Entitlements
  }
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

export type PlatformUserRole = 'SUPERADMIN' | 'STAFF'

export interface PlatformUser {
  id: string
  email: string
  role: PlatformUserRole
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export interface Plan {
  id: string
  name: string
  description: string | null
  isActive: boolean
  aiEnabled: boolean
  whatsappEnabled: boolean
  karisLinkEnabled: boolean
  features: Record<string, any> | null
  maxUsers: number | null
  maxWhatsappConnections: number | null
  createdAt: string
  updatedAt: string
}

export interface CompanySubscription {
  id: string
  companyId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
  plan: Plan
}

export interface AdminCompany extends Company {
  aiEnabled: boolean
  whatsappEnabled: boolean
  karisLinkEnabled: boolean
  createdAt: string
  updatedAt: string
  subscription: CompanySubscription | null
  _count?: { users: number; contacts: number; conversations: number; messages: number }
}

export interface MyCompany extends AdminCompany {
  assistant: Assistant | null
  whatsappConnections: WhatsappConnection[]
  entitlements: Entitlements
}
