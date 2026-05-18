<template>
  <div class="inbox-page" :class="{ 'panel-open': showContactPanel && selectedConversation, 'mobile-thread': mobileView === 'thread' }">
    <!-- Filters column -->
    <aside class="inbox-filters">
      <h4>Caixa de entrada</h4>
      <div
        v-for="f in filters"
        :key="f.key"
        class="item"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        <span style="flex:1;">{{ f.label }}</span>
        <span class="count">{{ f.count }}</span>
      </div>

      <h4>Status</h4>
      <div
        v-for="f in statusFilters"
        :key="f.key"
        class="item"
        :class="{ active: activeFilter === f.key }"
        @click="activeFilter = f.key"
      >
        <span style="flex:1;">{{ f.label }}</span>
        <span class="count">{{ f.count }}</span>
      </div>

      <template v-if="allTags.length">
        <h4>Tags</h4>
        <div
          v-for="tag in allTags"
          :key="tag.label"
          class="item"
          :class="{ active: activeFilter === `tag:${tag.label}` }"
          @click="activeFilter = `tag:${tag.label}`"
        >
          <span class="dot" :style="`background:${tag.color};`" />
          <span style="flex:1;">{{ tag.label }}</span>
          <span class="count">{{ tag.count }}</span>
        </div>
      </template>
    </aside>

    <!-- Conversation list -->
    <div class="inbox-list">
      <div class="list-header">
        <h3>Conversas</h3>
        <div style="display:flex;gap:4px;">
          <button class="icon-btn" style="width:30px;height:30px;border:0;background:transparent;" title="Buscar" @click="searchOpen = !searchOpen">
            <Icon name="search" :size="15" />
          </button>
          <button class="icon-btn" style="width:30px;height:30px;border:0;background:transparent;" title="Atualizar" @click="loadConversations">
            <Icon name="refresh" :size="15" />
          </button>
        </div>
      </div>

      <!-- Search bar (toggleable) -->
      <div v-if="searchOpen" style="padding:8px 12px;border-bottom:1px solid var(--ka-border);">
        <input
          v-model="search"
          style="width:100%;height:34px;padding:0 12px;border:1px solid var(--ka-border);border-radius:8px;background:var(--ka-gray-50);font-size:13px;color:var(--ka-fg);outline:none;"
          placeholder="Buscar contato ou mensagem"
          autofocus
        />
      </div>

      <!-- Skeletons -->
      <template v-if="loadingConversations">
        <div v-for="i in 8" :key="i" style="display:flex;gap:10px;padding:14px 16px;border-bottom:1px solid var(--ka-divider);">
          <div style="width:36px;height:36px;border-radius:9999px;background:var(--ka-gray-100);flex-shrink:0;animation:ib-pulse 1.5s infinite;" />
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <div style="height:13px;background:var(--ka-gray-100);border-radius:4px;width:55%;animation:ib-pulse 1.5s infinite;" />
            <div style="height:11px;background:var(--ka-gray-100);border-radius:4px;width:80%;animation:ib-pulse 1.5s infinite;" />
          </div>
        </div>
      </template>

      <div
        v-for="conv in filteredConversations"
        v-else
        :key="conv.id"
        class="conv"
        :class="{ active: selectedId === conv.id }"
        @click="selectConversation(conv.id)"
      >
        <div style="position:relative;width:36px;height:36px;flex-shrink:0;">
          <div class="avatar" :style="`background:${avatarColor(conv.contact?.name || conv.contact?.phone)};width:100%;height:100%;font-size:13px;`">
            {{ initials(conv.contact?.name || conv.contact?.phone) }}
          </div>
          <!-- Source channel badge -->
          <span class="src-badge" :class="srcBadgeClass(conv.source)" :title="sourceLabel(conv.source)">
            <svg v-if="conv.source === 'instagram'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/>
            </svg>
            <svg v-else-if="conv.source === 'karis_link'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6"/><path d="M10 14 21 3"/>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            </svg>
            <svg v-else width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
            </svg>
          </span>
        </div>
        <div class="body">
          <div class="top-row">
            <span class="name">{{ conv.contact?.name || conv.contact?.phone || 'Contato' }}</span>
            <span class="when">{{ relativeTime(conv.updatedAt) }}</span>
          </div>
          <div class="preview">{{ conv.lastMessage?.content || 'Sem mensagens ainda' }}</div>
          <div class="meta">
            <span v-if="conv.aiEnabled === false" class="badge neutral" style="height:18px;padding:0 7px;font-size:10px;">humano</span>
            <span v-else-if="conv.status === 'OPEN'" class="badge success" style="height:18px;padding:0 7px;font-size:10px;"><span class="bdot" />aberta</span>
            <span v-else-if="conv.status === 'CLOSED'" class="badge neutral" style="height:18px;padding:0 7px;font-size:10px;">fechada</span>
            <span v-else-if="conv.status === 'SNOOZED'" class="badge warning" style="height:18px;padding:0 7px;font-size:10px;">adiada</span>
            <span v-if="conv.unreadCount" class="unread">{{ conv.unreadCount }}</span>
          </div>
        </div>
      </div>

      <div v-if="!loadingConversations && !filteredConversations.length" style="padding:40px 20px;text-align:center;color:var(--ka-fg-muted);font-size:13px;">
        <Icon name="message" :size="28" style="opacity:0.3;display:block;margin:0 auto 8px;" />
        Nenhuma conversa encontrada.
      </div>
    </div>

    <!-- Thread -->
    <div class="thread" v-if="selectedConversation">
      <div class="thread-header">
        <button class="mobile-back-btn" type="button" title="Voltar" @click="goBackMobile">
          <Icon name="arrowLeft" :size="20" />
        </button>
        <div style="position:relative;flex-shrink:0;">
          <div class="avatar" :style="`background:${avatarColor(selectedContact?.name || selectedContact?.phone)};`">
            {{ initials(selectedContact?.name || selectedContact?.phone) }}
          </div>
          <span class="src-badge" :class="srcBadgeClass(selectedConversation.source)" :title="sourceLabel(selectedConversation.source)">
            <svg v-if="selectedConversation.source === 'instagram'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/>
            </svg>
            <svg v-else-if="selectedConversation.source === 'karis_link'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6"/><path d="M10 14 21 3"/>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            </svg>
            <svg v-else width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>
            </svg>
          </span>
        </div>
        <div class="info">
          <div class="name">{{ selectedContact?.name || selectedContact?.phone || 'Contato' }}</div>
          <div class="meta">
            <span class="dot" style="background:var(--ka-success);" />
            {{ selectedContact?.phone || 'Sem telefone' }}
            ·
            <span class="src-chip" :class="srcBadgeClass(selectedConversation.source)">
              {{ sourceLabel(selectedConversation.source) }}
            </span>
          </div>
        </div>
        <div class="right">
          <button class="icon-btn" title="Tags"><Icon name="tag" :size="16" /></button>
          <button v-if="selectedConversation.status === 'OPEN'" class="btn primary sm" :disabled="resolving" @click="resolveConversation">
            <Icon name="check" :size="14" />
            {{ resolving ? 'Resolvendo…' : 'Resolver' }}
          </button>
          <button v-else class="btn secondary sm" @click="reopenConversation">
            <Icon name="refresh" :size="14" />
            Reabrir
          </button>
          <button class="icon-btn" title="Painel do contato" @click="showContactPanel = !showContactPanel">
            <Icon name="user" :size="16" />
          </button>
        </div>
      </div>

      <div class="thread-messages" ref="messagesEl">
        <!-- Loading -->
        <template v-if="loadingMessages">
          <div v-for="i in 6" :key="i" :style="`display:flex;${i%2===0?'justify-content:flex-end;':''}`">
            <div :style="`width:${120+i*30}px;height:44px;border-radius:12px;background:var(--ka-gray-100);animation:ib-pulse 1.5s infinite;`" />
          </div>
        </template>

        <template v-else>
          <div v-if="!messages.length" style="align-self:center;font-size:13px;color:var(--ka-fg-muted);">
            <Icon name="message" :size="28" style="opacity:0.3;display:block;margin:0 auto 8px;" />
            Sem mensagens ainda.
          </div>

          <template v-for="(msg, i) in messages" :key="msg.id">
            <!-- Day divider when date changes -->
            <div
              v-if="i === 0 || dayOf(messages[i-1].createdAt) !== dayOf(msg.createdAt)"
              class="day-divider"
            >{{ dayLabel(msg.createdAt) }}</div>

            <!-- Instagram COMMENT card -->
            <div
              v-if="msg.metadata?.type === 'COMMENT'"
              class="ig-comment-card"
              :class="msg.direction === 'OUTBOUND' ? 'ig-comment-card--out' : 'ig-comment-card--in'"
            >
              <!-- Header: Instagram icon + label + author -->
              <div class="ig-comment-card-header">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
                  <defs>
                    <radialGradient id="igcc" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stop-color="#fdf497"/>
                      <stop offset="45%" stop-color="#fd5949"/>
                      <stop offset="60%" stop-color="#d6249f"/>
                      <stop offset="90%" stop-color="#285AEB"/>
                    </radialGradient>
                  </defs>
                  <rect width="24" height="24" rx="6" fill="url(#igcc)"/>
                  <rect x="6" y="6" width="12" height="12" rx="3" fill="none" stroke="white" stroke-width="1.5"/>
                  <circle cx="12" cy="12" r="3" fill="none" stroke="white" stroke-width="1.5"/>
                  <circle cx="16.5" cy="7.5" r="1" fill="white"/>
                </svg>
                <span class="ig-comment-card-label">Comentário</span>
                <span v-if="msg.senderName || msg.metadata?.senderName" class="ig-comment-card-author">
                  @{{ msg.senderName || msg.metadata?.senderName }}
                </span>
                <span class="ig-comment-card-time">{{ timeOf(msg.createdAt) }}</span>
              </div>

              <!-- Post context (only when postCaption is available) -->
              <div v-if="msg.metadata?.postCaption" class="ig-comment-card-post">
                <span class="ig-comment-card-post-label">
                  <Icon name="fileText" :size="11" />
                  Post
                </span>
                <span class="ig-comment-card-post-text">{{ msg.metadata.postCaption.length > 120 ? msg.metadata.postCaption.slice(0, 120) + '…' : msg.metadata.postCaption }}</span>
              </div>

              <!-- Comment text -->
              <div class="ig-comment-card-body">
                <span v-if="msg.senderType === 'AI'" class="ig-comment-ai-badge">
                  <Icon name="sparkles" :size="10" /> IA
                </span>
                {{ msg.content }}
              </div>
            </div>

            <!-- Instagram DM bubble -->
            <div
              v-else-if="msg.metadata?.type === 'DM'"
              class="msg"
              :class="msgClass(msg)"
            >
              <!-- DM header: IG icon + badge -->
              <div class="ig-dm-header">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
                  <defs>
                    <radialGradient id="igdm" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stop-color="#fdf497"/>
                      <stop offset="45%" stop-color="#fd5949"/>
                      <stop offset="60%" stop-color="#d6249f"/>
                      <stop offset="90%" stop-color="#285AEB"/>
                    </radialGradient>
                  </defs>
                  <rect width="24" height="24" rx="6" fill="url(#igdm)"/>
                  <rect x="6" y="6" width="12" height="12" rx="3" fill="none" stroke="white" stroke-width="1.5"/>
                  <circle cx="12" cy="12" r="3" fill="none" stroke="white" stroke-width="1.5"/>
                  <circle cx="16.5" cy="7.5" r="1" fill="white"/>
                </svg>
                <span class="ig-dm-label">DM</span>
                <span v-if="msg.senderType === 'AI'">· <Icon name="sparkles" :size="10" /> IA</span>
              </div>
              {{ msg.content }}
              <div class="time">
                <span>{{ timeOf(msg.createdAt) }}</span>
              </div>
            </div>

            <!-- Regular message bubble (WhatsApp / sem metadata.type) -->
            <div
              v-else
              class="msg"
              :class="msgClass(msg)"
            >
              <div v-if="msg.senderType === 'AI'" class="author">
                <Icon name="sparkles" :size="11" />
                IA · Karis
              </div>
              {{ msg.content }}
              <div class="time">
                <span>{{ timeOf(msg.createdAt) }}</span>
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- Composer -->
      <div class="composer">
        <!-- AI suggestion -->
        <div v-if="lastAiMessage && !dismissedSuggestion" class="ai-suggestion">
          <div style="width:28px;height:28px;border-radius:8px;background:rgba(139,92,246,0.16);color:var(--ka-bot);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <Icon name="sparkles" :size="14" />
          </div>
          <div style="flex:1;">
            <div class="label"><Icon name="sparkles" :size="11" />Sugestão da IA</div>
            <div class="text">{{ lastAiMessage.content }}</div>
            <div class="actions">
              <button class="btn primary sm" @click="acceptSuggestion">
                <Icon name="check" :size="13" />Aceitar e enviar
              </button>
              <button class="btn secondary sm" @click="draft = lastAiMessage.content; dismissedSuggestion = true">
                Editar antes
              </button>
              <button class="btn ghost sm" @click="dismissedSuggestion = true">Descartar</button>
            </div>
          </div>
        </div>

        <!-- Instagram reply context -->
        <div v-if="selectedConversation?.source === 'instagram' || selectedConversation?.source === 'instagram_comment'" class="ig-reply-banner">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
            <defs>
              <radialGradient id="igbanner" cx="30%" cy="107%" r="150%">
                <stop offset="0%" stop-color="#fdf497"/>
                <stop offset="45%" stop-color="#fd5949"/>
                <stop offset="60%" stop-color="#d6249f"/>
                <stop offset="90%" stop-color="#285AEB"/>
              </radialGradient>
            </defs>
            <rect width="24" height="24" rx="6" fill="url(#igbanner)"/>
            <rect x="6" y="6" width="12" height="12" rx="3" fill="none" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="3" fill="none" stroke="white" stroke-width="1.5"/>
            <circle cx="16.5" cy="7.5" r="1" fill="white"/>
          </svg>
          <span>Respondendo via Instagram · a resposta será enviada como comentário ou DM</span>
        </div>

        <div class="composer-input">
          <div class="composer-actions">
            <button class="icon-mini" type="button" title="Anexar"><Icon name="paperclip" :size="16" /></button>
            <button class="icon-mini" type="button" title="Emoji"><Icon name="smile" :size="16" /></button>
          </div>
          <textarea
            v-model="draft"
            :placeholder="selectedConversation?.source === 'instagram' || selectedConversation?.source === 'instagram_comment' ? 'Responder no Instagram…' : 'Digite uma mensagem...'"
            rows="1"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button class="icon-mini" type="button" title="Áudio"><Icon name="mic" :size="16" /></button>
          <button
            class="send"
            type="button"
            :disabled="!draft.trim() || sending"
            @click="sendMessage"
          >
            <Icon name="send" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state when no conversation selected -->
    <div v-else class="thread" style="align-items:center;justify-content:center;">
      <div style="text-align:center;color:var(--ka-fg-muted);">
        <Icon name="message" :size="40" style="opacity:0.2;display:block;margin:0 auto 12px;" />
        <div style="font-size:15px;font-weight:500;margin-bottom:6px;">Selecione uma conversa</div>
        <div style="font-size:13px;">Escolha um atendimento para ver as mensagens.</div>
      </div>
    </div>

    <!-- Contact panel -->
    <div v-if="showContactPanel && selectedConversation" class="contact-panel">
      <div class="head">
        <div class="avatar" :style="`background:${avatarColor(selectedContact?.name || selectedContact?.phone)};width:64px;height:64px;font-size:22px;`">
          {{ initials(selectedContact?.name || selectedContact?.phone) }}
        </div>
        <div class="name">{{ selectedContact?.name || 'Contato' }}</div>
        <div class="sub">{{ selectedContact?.phone || 'Sem telefone' }}</div>
        <div class="actions-row">
          <button class="btn secondary sm"><Icon name="phone" :size="13" />Ligar</button>
          <button class="btn secondary sm" @click="navigateTo('/contacts')"><Icon name="user" :size="13" />Perfil</button>
        </div>
      </div>

      <div class="field-block">
        <h5>Contato</h5>
        <div class="kv"><span class="k">Email</span><span class="v">{{ selectedContact?.email || 'Não informado' }}</span></div>
        <div v-if="selectedContact?.city || selectedContact?.state" class="kv">
          <span class="k">Cidade</span>
          <span class="v">{{ [selectedContact?.city, selectedContact?.state].filter(Boolean).join(', ') }}</span>
        </div>
        <div class="kv"><span class="k">1º contato</span><span class="v">{{ selectedContact?.createdAt ? relativeTime(selectedContact.createdAt) : 'Não informado' }}</span></div>
        <div class="kv">
          <span class="k">Origem</span>
          <span class="v">
            <span class="src-chip" :class="srcBadgeClass(selectedConversation.source)">
              {{ sourceLabel(selectedConversation.source) }}
            </span>
          </span>
        </div>
      </div>

      <div class="field-block">
        <h5>Tags</h5>
        <div class="tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
          <span v-for="tag in selectedTags" :key="tag" class="badge outline" style="font-size:12px;">
            <span class="bdot" style="background:var(--ka-brand);" />{{ tag }}
          </span>
          <span v-if="!selectedTags.length" style="font-size:12px;color:var(--ka-fg-muted);">Sem tags</span>
        </div>
      </div>

      <div class="field-block">
        <h5>Deal em andamento</h5>
        <div v-if="dealLoading" style="height:56px;border-radius:10px;background:var(--ka-gray-100);animation:ib-pulse 1.5s infinite;margin-top:8px;" />
        <div v-else-if="contactDeal" class="card" style="padding:12px;margin-top:8px;box-shadow:none;cursor:pointer;" @click="navigateTo('/crm')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;font-size:13px;">{{ contactDeal.contact?.name || contactDeal.title }}</div>
              <div style="font-size:11px;color:var(--ka-fg-muted);margin-top:2px;">{{ contactDeal.stage?.name || '—' }}</div>
            </div>
            <div v-if="contactDeal.valueCents" style="font-weight:700;font-size:15px;color:var(--ka-success);">
              {{ formatMoney(contactDeal.valueCents) }}
            </div>
          </div>
        </div>
        <div v-else style="font-size:12px;color:var(--ka-fg-muted);margin-top:8px;">Nenhum deal ativo</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatDateTime, formatMoney, unwrapList } from '~/composables/useKarisData'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()

const route = useRoute()
const api = useApi()
const toast = useToast()

const mobileView = ref<'list' | 'thread'>('list')

const search = ref('')
const searchOpen = ref(false)
const activeFilter = ref('all')
const conversations = ref<any[]>([])
const selectedId = ref<string | null>(
  typeof route.query.conversation === 'string' ? route.query.conversation : null
)
const selectedConversation = ref<any | null>(null)
const messages = ref<any[]>([])
const draft = ref('')
const loadingConversations = ref(true)
const loadingMessages = ref(false)
const sending = ref(false)
const dismissedSuggestion = ref(false)
const showContactPanel = ref(true)
const contactDeal = ref<any | null>(null)
const dealLoading = ref(false)
const resolving = ref(false)
const messagesEl = ref<HTMLElement | null>(null)

const AVATAR_COLORS = ['#5B7FFF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

function avatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0]
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function relativeTime(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function dayOf(dateStr: string) {
  return new Date(dateStr).toDateString()
}

const TZ = 'America/Recife'

function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const todayStr = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const dStr    = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yStr    = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(yesterdayDate)
  if (dStr === todayStr) return 'Hoje'
  if (dStr === yStr) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: TZ })
}

function timeOf(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
}

function msgClass(msg: any) {
  if (msg.direction === 'INBOUND') return 'in'
  if (msg.senderType === 'AI') return 'bot'
  return 'out'
}

function srcBadgeClass(source?: string) {
  if (source === 'instagram' || source === 'instagram_comment') return 'ig'
  if (source === 'karis_link') return 'kl'
  return 'wa'
}

function sourceLabel(source?: string) {
  if (source === 'instagram_comment') return 'Instagram Comentário'
  if (source === 'instagram') return 'Instagram DM'
  if (source === 'karis_link') return 'Karis Link'
  return 'WhatsApp'
}

const myUserId = computed(() => auth.user?.id)

const filters = computed(() => {
  const all = conversations.value
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  return [
    { key: 'all', label: 'Caixa de entrada', count: all.filter(c => c.status === 'OPEN').length },
    { key: 'mine', label: 'Minhas conversas', count: all.filter(c => c.assigneeId === myUserId.value).length },
    { key: 'unassigned', label: 'Não atribuídas', count: all.filter(c => !c.assigneeId).length },
    { key: 'pending', label: 'Pendentes', count: all.filter(c => c.aiEnabled === false && c.status === 'OPEN').length },
    { key: 'mentioned', label: 'Mencionei', count: 0 },
  ]
})

const statusFilters = computed(() => {
  const all = conversations.value
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  return [
    { key: 'open', label: 'Abertas', count: all.filter(c => c.status === 'OPEN').length },
    { key: 'ai', label: 'Atendidas pela IA', count: all.filter(c => c.aiEnabled !== false && c.status === 'OPEN').length },
    { key: 'closed-today', label: 'Fechadas hoje', count: all.filter(c => c.status === 'CLOSED' && new Date(c.updatedAt) >= todayStart).length },
  ]
})

const allTags = computed(() => {
  const tagMap = new Map<string, { color: string; count: number }>()
  const TAG_COLORS = ['#5B7FFF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']
  for (const conv of conversations.value) {
    const tags: string[] = Array.isArray(conv.tags) ? conv.tags : []
    for (const tag of tags) {
      if (!tag) continue
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { color: TAG_COLORS[tagMap.size % TAG_COLORS.length], count: 0 })
      }
      tagMap.get(tag)!.count++
    }
  }
  return [...tagMap.entries()].map(([label, v]) => ({ label, ...v }))
})

const selectedContact = computed(() =>
  selectedConversation.value?.contact ||
  conversations.value.find(c => c.id === selectedId.value)?.contact ||
  null
)

const selectedTags = computed(() => {
  const raw = selectedContact.value?.tags || selectedConversation.value?.tags || []
  return Array.isArray(raw) ? raw.filter(Boolean).slice(0, 6) : []
})

const lastAiMessage = computed(() =>
  [...messages.value].reverse().find(m => m.senderType === 'AI')
)

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase()
  const f = activeFilter.value
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  return conversations.value.filter(conv => {
    if (f === 'all' && conv.status !== 'OPEN') return false
    if (f === 'mine' && conv.assigneeId !== myUserId.value) return false
    if (f === 'unassigned' && conv.assigneeId) return false
    if (f === 'pending' && (conv.aiEnabled !== false || conv.status !== 'OPEN')) return false
    if (f === 'mentioned') return false
    if (f === 'open' && conv.status !== 'OPEN') return false
    if (f === 'ai' && (conv.aiEnabled === false || conv.status !== 'OPEN')) return false
    if (f === 'closed-today' && (conv.status !== 'CLOSED' || new Date(conv.updatedAt) < todayStart)) return false
    if (f.startsWith('tag:')) {
      const tag = f.slice(4)
      const tags: string[] = Array.isArray(conv.tags) ? conv.tags : []
      if (!tags.includes(tag)) return false
    }
    if (!q) return true
    return `${conv.contact?.name || ''} ${conv.contact?.phone || ''} ${conv.lastMessage?.content || ''}`.toLowerCase().includes(q)
  })
})

async function loadConversations() {
  loadingConversations.value = true
  try {
    const res = await api.fetch<any>('/conversations?limit=100')
    conversations.value = unwrapList(res, ['conversations'])
    if (!selectedId.value && conversations.value[0]) selectedId.value = conversations.value[0].id
    if (selectedId.value) await selectConversation(selectedId.value)
  } finally {
    loadingConversations.value = false
  }
}

function goBackMobile() {
  mobileView.value = 'list'
}

async function selectConversation(id: string) {
  selectedId.value = id
  mobileView.value = 'thread'
  dismissedSuggestion.value = false
  contactDeal.value = null
  loadingMessages.value = true
  try {
    const [convRes, msgRes] = await Promise.all([
      api.fetch<any>(`/conversations/${id}`),
      api.fetch<any>(`/messages/conversation/${id}`),
    ])
    selectedConversation.value = convRes.conversation
    messages.value = unwrapList(msgRes, ['messages'])
    const cid = convRes.conversation?.contactId || convRes.conversation?.contact?.id
    if (cid) loadContactDeal(cid)
    await nextTick()
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  } finally {
    loadingMessages.value = false
  }
}

async function loadContactDeal(contactId: string) {
  dealLoading.value = true
  try {
    const res = await api.fetch<any>(`/crm/deals?contactId=${contactId}&limit=1`)
    const list = unwrapList(res, ['deals'])
    contactDeal.value = list[0] || null
  } catch {
    contactDeal.value = null
  } finally {
    dealLoading.value = false
  }
}

async function resolveConversation() {
  if (!selectedId.value || resolving.value) return
  resolving.value = true
  try {
    await api.fetch(`/conversations/${selectedId.value}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CLOSED' }),
    })
    toast.success('Conversa resolvida.')
    await loadConversations()
    selectedId.value = null
    selectedConversation.value = null
  } catch {
    toast.error('Não foi possível resolver a conversa.')
  } finally {
    resolving.value = false
  }
}

async function reopenConversation() {
  if (!selectedId.value) return
  try {
    await api.fetch(`/conversations/${selectedId.value}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'OPEN' }),
    })
    toast.success('Conversa reaberta.')
    await loadConversations()
  } catch {
    toast.error('Não foi possível reabrir a conversa.')
  }
}

async function sendMessage() {
  if (!selectedId.value || !draft.value.trim()) return
  const content = draft.value.trim()
  sending.value = true
  draft.value = ''
  try {
    await api.fetch(`/messages/conversation/${selectedId.value}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    await selectConversation(selectedId.value)
  } catch {
    toast.error('Erro ao enviar mensagem.')
    draft.value = content
  } finally {
    sending.value = false
  }
}

async function acceptSuggestion() {
  if (!lastAiMessage.value) return
  draft.value = lastAiMessage.value.content
  dismissedSuggestion.value = true
  await sendMessage()
}

onMounted(loadConversations)
</script>

<style scoped>
@keyframes ib-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Source channel badge (avatar corner) */
.src-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--ka-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.src-badge.wa { background: #25D366; }
.src-badge.ig { background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%); }
.src-badge.kl { background: var(--ka-brand); }

/* ── Instagram comment card ──────────────────────────────── */
.ig-comment-card {
  max-width: 340px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--ka-border);
  background: var(--ka-surface);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
}

.ig-comment-card--in  { align-self: flex-start; }
.ig-comment-card--out { align-self: flex-end; }

.ig-comment-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 7px;
  background: linear-gradient(135deg, rgba(253,244,151,0.18) 0%, rgba(253,89,73,0.12) 50%, rgba(214,36,159,0.12) 100%);
  border-bottom: 1px solid rgba(214,36,159,0.1);
}

.ig-comment-card-label {
  font-size: 11px;
  font-weight: 700;
  color: #d6249f;
  letter-spacing: 0.03em;
}

.ig-comment-card-author {
  font-size: 11px;
  color: var(--ka-fg-2);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ig-comment-card-time {
  font-size: 10px;
  color: var(--ka-fg-muted);
  flex-shrink: 0;
}

.ig-comment-card-post {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 7px 12px;
  background: var(--ka-surface-2, var(--ka-gray-50));
  border-bottom: 1px solid var(--ka-border);
}

.ig-comment-card-post-label {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: var(--ka-fg-muted);
  white-space: nowrap;
  margin-top: 1px;
  flex-shrink: 0;
}

.ig-comment-card-post-text {
  font-size: 11px;
  color: var(--ka-fg-2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ig-comment-card-body {
  padding: 9px 12px 10px;
  font-size: 13px;
  color: var(--ka-fg);
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ig-comment-ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: var(--ka-bot, #8B5CF6);
  margin-bottom: 2px;
}

/* Instagram DM header inside bubble */
.ig-dm-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  color: #d6249f;
  margin-bottom: 4px;
  opacity: 0.85;
}

.ig-dm-label {
  font-size: 10px;
  font-weight: 700;
  color: #d6249f;
  letter-spacing: 0.04em;
}

/* Instagram reply banner in composer */
.ig-reply-banner {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  background: linear-gradient(135deg, rgba(253,244,151,0.1) 0%, rgba(253,89,73,0.08) 50%, rgba(40,90,235,0.08) 100%);
  border-top: 1px solid rgba(214,36,159,0.12);
  border-bottom: 1px solid rgba(214,36,159,0.08);
  font-size: 11px;
  color: var(--ka-fg-2);
}

/* Source chip (thread header) */
.src-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 99px;
  letter-spacing: 0.02em;
}
.src-chip.wa { background: rgba(37,211,102,0.12); color: #16a34a; }
.src-chip.ig { background: rgba(214,36,159,0.1); color: #d6249f; }
.src-chip.kl { background: rgba(91,127,255,0.12); color: var(--ka-brand); }
</style>
