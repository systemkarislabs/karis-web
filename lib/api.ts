'use client'

const BASE = process.env.NEXT_PUBLIC_API_URL!

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('karisAuthToken')
}

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('karisAdminToken')
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (res.status === 401) {
    localStorage.removeItem('karisAuthToken')
    localStorage.removeItem('karisCurrentUser')
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erro na requisição')
  return data as T
}

async function adminRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(extraHeaders ?? {}) }
  if (auth) {
    const token = getAdminToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (res.status === 401) {
    localStorage.removeItem('karisAdminToken')
    localStorage.removeItem('karisAdminUser')
    window.location.href = '/admin/login'
    throw new Error('Sessão expirada')
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Erro na requisição')
  return data as T
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: import('./types').User }>('POST', '/api/auth/login', { email, password }, false),

  register: (data: { name: string; email: string; password: string; companyName: string }) =>
    request<{ token: string; user: import('./types').User }>('POST', '/api/auth/register', data, false),

  // Dashboard
  getStats: () =>
    request<import('./types').DashboardStats>('GET', '/api/companies/me/stats'),
  getMyCompany: () =>
    request<{ company: import('./types').MyCompany }>('GET', '/api/companies/me'),

  // Assistant
  getAssistant: () =>
    request<{ assistant: import('./types').Assistant }>('GET', '/api/assistant'),

  upsertAssistant: (data: Partial<import('./types').Assistant>) =>
    request<{ assistant: import('./types').Assistant }>('PUT', '/api/assistant', data),

  // Knowledge
  getKnowledge: () =>
    request<{ knowledgeBases: import('./types').KnowledgeBase[] }>('GET', '/api/knowledge'),

  createKnowledge: (data: { title: string; content: string }) =>
    request<{ knowledgeBase: import('./types').KnowledgeBase }>('POST', '/api/knowledge', data),

  deleteKnowledge: (id: string) =>
    request<{ message: string }>('DELETE', `/api/knowledge/${id}`),

  // Contacts
  getContacts: () =>
    request<{ contacts: import('./types').Contact[] }>('GET', '/api/contacts'),

  // Conversations
  getConversations: () =>
    request<{ conversations: import('./types').Conversation[] }>('GET', '/api/conversations'),

  getConversation: (id: string) =>
    request<{ conversation: import('./types').Conversation & { messages: import('./types').Message[] } }>('GET', `/api/conversations/${id}`),

  updateConversation: (id: string, data: { aiEnabled?: boolean; status?: string }) =>
    request<{ conversation: import('./types').Conversation }>('PATCH', `/api/conversations/${id}`, data),

  markConversationRead: (id: string) =>
    request<{ readState: any }>('POST', `/api/conversations/${id}/read`, {}),

  markAllConversationsRead: () =>
    request<{ updated: number; created: number }>('POST', '/api/conversations/read-all', {}),

  setConversationAssignee: (id: string, userId: string | null) =>
    request<{ conversation: import('./types').Conversation }>('PUT', `/api/conversations/${id}/assignee`, { userId }),

  getUsers: (role?: 'ADMIN' | 'AGENT') => {
    const qs = role ? `?role=${encodeURIComponent(role)}` : ''
    return request<{ users: import('./types').User[] }>('GET', `/api/users${qs}`)
  },

  // CRM
  getCrmPipelines: () =>
    request<{ pipelines: import('./types').CrmPipeline[] }>('GET', '/api/crm/pipelines'),

  getCrmDeals: (params?: { pipelineId?: string; stageId?: string; status?: string; assignedUserId?: string; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.pipelineId) qs.set('pipelineId', params.pipelineId)
    if (params?.stageId) qs.set('stageId', params.stageId)
    if (params?.status) qs.set('status', params.status)
    if (params?.assignedUserId) qs.set('assignedUserId', params.assignedUserId)
    if (params?.q) qs.set('q', params.q)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ deals: import('./types').CrmDeal[] }>('GET', `/api/crm/deals${suffix}`)
  },

  createCrmDeal: (data: { title: string; valueCents?: number | null; currency?: string; contactId?: string; conversationId?: string; pipelineId?: string; stageId?: string; assignedUserId?: string | null }) =>
    request<{ deal: import('./types').CrmDeal }>('POST', '/api/crm/deals', data),

  getCrmDeal: (id: string) =>
    request<{ deal: import('./types').CrmDeal }>('GET', `/api/crm/deals/${id}`),

  updateCrmDeal: (id: string, data: Partial<{ title: string; valueCents: number | null; currency: string; stageId: string; assignedUserId: string | null; status: string }>) =>
    request<{ deal: import('./types').CrmDeal }>('PATCH', `/api/crm/deals/${id}`, data),

  addCrmDealNote: (id: string, content: string) =>
    request<{ note: { id: string; content: string; createdAt: string } }>('POST', `/api/crm/deals/${id}/notes`, { content }),

  addCrmDealTask: (id: string, data: { title: string; dueAt?: string | null; assignedUserId?: string | null }) =>
    request<{ task: import('./types').CrmTask }>('POST', `/api/crm/deals/${id}/tasks`, data),

  getCrmTasks: (params?: { mine?: boolean; status?: string }) => {
    const qs = new URLSearchParams()
    if (params?.mine) qs.set('mine', '1')
    if (params?.status) qs.set('status', params.status)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ tasks: import('./types').CrmTask[] }>('GET', `/api/crm/tasks${suffix}`)
  },

  startTakeover: (id: string, reason?: string) =>
    request<{ takeover: import('./types').HumanTakeover }>('POST', `/api/conversations/${id}/human-takeover`, { reason }),

  endTakeover: (id: string, enableAi = true) =>
    request<{ takeover: import('./types').HumanTakeover }>('POST', `/api/conversations/${id}/human-takeover/end`, { enableAi }),

  // Messages
  getMessages: (conversationId: string) =>
    request<{ messages: import('./types').Message[] }>('GET', `/api/messages/conversation/${conversationId}`),

  sendMessage: (conversationId: string, content: string) =>
    request<{ message: import('./types').Message }>('POST', `/api/messages/conversation/${conversationId}`, { content, direction: 'OUTBOUND', senderType: 'HUMAN' }),

  // WhatsApp
  getWhatsappStatus: () =>
    request<{ status: string; connection: import('./types').WhatsappConnection | null }>('GET', '/api/whatsapp/status'),

  connectWhatsapp: (data?: { number?: string | null }) =>
    request<{ instanceName: string; qrCode: string | null; pairingCode?: string | null; status: string; message?: string }>('POST', '/api/whatsapp/connect', data || {}),

  disconnectWhatsapp: () =>
    request<{ message: string }>('DELETE', '/api/whatsapp/disconnect'),

  getWhatsappDiagnostics: () =>
    request<import('./types').WhatsappDiagnostics>('GET', '/api/whatsapp/diagnostics'),

  // Campaigns
  getCampaigns: () =>
    request<{ campaigns: import('./types').Campaign[] }>('GET', '/api/campaigns'),

  createCampaign: (data: { name: string; message: string; stageId?: string | null }) =>
    request<{ campaign: import('./types').Campaign }>('POST', '/api/campaigns', data),

  getCampaign: (id: string) =>
    request<{ campaign: any }>('GET', `/api/campaigns/${id}`),

  sendCampaign: (id: string) =>
    request<{ job: any }>('POST', `/api/campaigns/${id}/send`, {}),

  // Google Calendar integration
  getGoogleAuthUrl: () =>
    request<{ url: string }>('GET', '/api/integrations/google/auth-url'),

  getGoogleStatus: () =>
    request<import('./types').GoogleIntegrationStatus>('GET', '/api/integrations/google/status'),

  disconnectGoogle: () =>
    request<{ message: string }>('POST', '/api/integrations/google/disconnect', {}),

  // Calendar
  getGoogleEvents: (params?: { timeMin?: string; timeMax?: string; maxResults?: number }) => {
    const qs = new URLSearchParams()
    if (params?.timeMin) qs.set('timeMin', params.timeMin)
    if (params?.timeMax) qs.set('timeMax', params.timeMax)
    if (typeof params?.maxResults === 'number') qs.set('maxResults', String(params.maxResults))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ connected: boolean; events: any[] }>('GET', `/api/calendar/google-events${suffix}`)
  },

  getAppointments: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams()
    if (params?.from) qs.set('from', params.from)
    if (params?.to) qs.set('to', params.to)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<{ appointments: import('./types').Appointment[] }>('GET', `/api/calendar/appointments${suffix}`)
  },

  createAppointment: (data: { title: string; startAt: string; endAt: string; contactId?: string | null; dealId?: string | null }) =>
    request<{ appointment: import('./types').Appointment }>('POST', '/api/calendar/appointments', data),

  adminBootstrap: (email: string, password: string, bootstrapSecret: string) =>
    adminRequest<{ token: string; platformUser: import('./types').PlatformUser }>(
      'POST',
      '/api/admin/auth/bootstrap',
      { email, password },
      false,
      { 'x-admin-bootstrap-secret': bootstrapSecret }
    ),

  adminLogin: (email: string, password: string) =>
    adminRequest<{ token: string; platformUser: import('./types').PlatformUser }>(
      'POST',
      '/api/admin/auth/login',
      { email, password },
      false
    ),

  adminListPlans: (includeInactive = false) =>
    adminRequest<{ plans: import('./types').Plan[] }>(
      'GET',
      `/api/admin/plans${includeInactive ? '?includeInactive=1' : ''}`
    ),

  adminCreatePlan: (data: Partial<import('./types').Plan> & { name: string }) =>
    adminRequest<{ plan: import('./types').Plan }>('POST', '/api/admin/plans', data),

  adminUpdatePlan: (id: string, data: Partial<import('./types').Plan>) =>
    adminRequest<{ plan: import('./types').Plan }>('PATCH', `/api/admin/plans/${id}`, data),

  adminDisablePlan: (id: string) =>
    adminRequest<{ plan: import('./types').Plan }>('DELETE', `/api/admin/plans/${id}`),

  adminListCompanies: (params?: { search?: string; take?: number; skip?: number }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (typeof params?.take === 'number') qs.set('take', String(params.take))
    if (typeof params?.skip === 'number') qs.set('skip', String(params.skip))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return adminRequest<{ companies: import('./types').AdminCompany[] }>('GET', `/api/admin/companies${suffix}`)
  },

  adminGetCompany: (id: string) =>
    adminRequest<{ company: import('./types').AdminCompany }>('GET', `/api/admin/companies/${id}`),

  adminUpdateCompany: (id: string, data: Partial<import('./types').AdminCompany>) =>
    adminRequest<{ company: import('./types').Company }>('PATCH', `/api/admin/companies/${id}`, data),

  adminUpsertCompanySubscription: (
    companyId: string,
    data: { planId: string; status?: import('./types').SubscriptionStatus; currentPeriodEnd?: string | null; cancelAtPeriodEnd?: boolean; applyPlanToCompany?: boolean }
  ) =>
    adminRequest<{ subscription: import('./types').CompanySubscription }>(
      'PUT',
      `/api/admin/companies/${companyId}/subscription`,
      data
    ),
}
