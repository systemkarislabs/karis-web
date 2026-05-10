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
  personality: 'prestativo' | 'direto' | 'formal' | 'descontraido' | null
  transferPhone: string | null
  transferConditions: string | null
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
  assignedUser?: { id: string; name: string; email: string } | null
  status: 'OPEN' | 'CLOSED'
  aiEnabled: boolean
  source: string | null
  campaign: string | null
  createdAt: string
  updatedAt: string
  contact: Contact
  humanTakeovers?: HumanTakeover[]
  _count?: { messages: number }
  lastMessage?: ConversationLastMessage | null
  pendingFollowUp?: Pick<FollowUp, 'id' | 'status' | 'dueAt'> | null
  unreadCount?: number
}

export interface Message {
  id: string
  conversationId: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderType: 'CONTACT' | 'HUMAN' | 'AI' | 'SYSTEM'
  content: string
  createdAt: string
}

export interface ConversationLastMessage {
  id: string
  content: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderType: 'CONTACT' | 'HUMAN' | 'AI' | 'SYSTEM'
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

export interface WhatsappDiagnostics {
  enabled: boolean
  hasEvolutionConfig: boolean
  apiBaseUrl: string
  connection: {
    id: string
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
    phoneNumber: string | null
    evolutionInstanceName: string | null
    evolutionApiUrl: string | null
    qrCode: boolean
    lastError: string | null
    lastQrAt: string | null
    lastConnectAttemptAt: string | null
    updatedAt: string
  } | null
  evolutionReachable: boolean
  evolutionState: any
  evolutionInfo?: {
    status?: number
    message?: string
    version?: string
    swagger?: string
    manager?: string
    documentation?: string
    [key: string]: any
  } | null
}

export interface CrmPipeline {
  id: string
  name: string
  stages: CrmStage[]
}

export interface CrmStage {
  id: string
  pipelineId: string
  name: string
  order: number
  color: string | null
}

export interface CrmDeal {
  id: string
  title: string
  valueCents: number | null
  currency: string
  status: 'OPEN' | 'WON' | 'LOST'
  aiScore: number | null
  aiNextAction: string | null
  stage: CrmStage
  contact: Contact
  assignedUser: { id: string; name: string; email: string } | null
  updatedAt: string
  createdAt: string
  conversation?: { id: string } | null
  notes?: { id: string; content: string; createdAt: string; authorUserId: string | null }[]
  tasks?: CrmTask[]
  followUps?: FollowUp[]
  activities?: { id: string; source: 'AI' | 'HUMAN' | 'SYSTEM'; type: string; payload: any; createdAt: string }[]
  _count?: { tasks: number; notes: number; activities: number }
}

export interface CrmTask {
  id: string
  title: string
  dueAt: string | null
  status: 'OPEN' | 'DONE' | 'CANCELED'
  assignedUser: { id: string; name: string; email: string } | null
  deal?: { id: string; title: string } | null
  contact?: { id: string; name: string | null; phone: string } | null
  createdAt: string
}

export interface Campaign {
  id: string
  name: string
  message: string
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED'
  stageId: string | null
  createdAt: string
  updatedAt: string
  _count?: { recipients: number; jobs: number }
}

export interface GoogleIntegrationStatus {
  connected: boolean
  googleCalendarId: string | null
  updatedAt: string | null
  hasGoogleConfig: boolean
}

export interface Appointment {
  id: string
  title: string
  startAt: string
  endAt: string
  status: 'SCHEDULED' | 'CANCELED'
  googleEventId: string | null
  contact?: { id: string; name: string | null; phone: string } | null
  deal?: { id: string; title: string } | null
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
  assistantId?: string
  title: string
  content: string
  fileUrl?: string | null
  createdAt: string
}

export interface FollowUpSetting {
  id: string
  companyId: string
  enabled: boolean
  delayMinutes: 15 | 30 | 45
  messageTemplate: string
  createdAt: string
  updatedAt: string
}

export interface FollowUp {
  id: string
  companyId: string
  conversationId: string
  contactId: string
  dealId: string | null
  messageId: string | null
  status: 'PENDING' | 'SENDING' | 'SENT' | 'CANCELED' | 'FAILED'
  dueAt: string
  sentAt: string | null
  canceledAt: string | null
  lastError: string | null
  attemptCount: number
  template: string
  createdAt: string
  updatedAt: string
  contact?: { id: string; name: string | null; phone: string }
  deal?: { id: string; title: string } | null
  conversation?: { id: string; status: 'OPEN' | 'CLOSED' }
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
