<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Boa {{ greeting }}, {{ firstName }} ☀</h1>
        <div class="sub">Aqui tá tudo sob controle. Hoje seu time já resolveu {{ overview?.conversations?.closed ?? 0 }} conversas.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn secondary" type="button" @click="refresh">
          <Icon name="refresh" :size="16" />
          Atualizar
        </button>
        <button class="btn primary" type="button" @click="navigateTo('/inbox')">
          <Icon name="plus" :size="16" />
          Nova conversa
        </button>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="quick-actions">
      <div class="quick" @click="navigateTo('/inbox')">
        <div class="ico"><Icon name="message" :size="20" /></div>
        <div>
          <div class="title">Nova conversa</div>
          <div class="desc">Abrir chat com novo contato</div>
        </div>
      </div>
      <div class="quick" @click="navigateTo('/crm')">
        <div class="ico"><Icon name="kanban" :size="20" /></div>
        <div>
          <div class="title">Ver pipeline</div>
          <div class="desc">{{ overview?.contacts?.newLast7d ?? 0 }} leads em aberto</div>
        </div>
      </div>
      <div class="quick" @click="navigateTo('/agent')">
        <div class="ico"><Icon name="sparkles" :size="20" /></div>
        <div>
          <div class="title">Treinar a IA</div>
          <div class="desc">Adicionar documentos</div>
        </div>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="kpi-grid">
      <div v-for="kpi in kpis" :key="kpi.label" class="kpi">
        <div class="label">{{ kpi.label }}</div>
        <div v-if="loading" style="height:40px;background:var(--ka-gray-100);border-radius:6px;margin:8px 0;animation:pulse 1.5s infinite;" />
        <div v-else class="value">{{ kpi.value }}</div>
        <div class="delta">
          <span v-if="kpi.trend" class="badge" :class="kpi.trend > 0 ? 'success' : 'danger'">
            <Icon :name="kpi.trend > 0 ? 'trendUp' : 'trendDown'" :size="11" />
            {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}%
          </span>
          <span v-else class="kpi-note" :class="kpi.noteClass">{{ kpi.note }}</span>
        </div>
        <svg v-if="kpi.sparkData.length > 1" class="kpi-spark" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="`sg-${kpi.label}`" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="var(--ka-brand)" stop-opacity="0.18" />
              <stop offset="100%" stop-color="var(--ka-brand)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <polygon :points="sparkArea(kpi.sparkData)" :fill="`url(#sg-${kpi.label})`" />
          <polyline fill="none" stroke="var(--ka-brand)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            :points="sparkLine(kpi.sparkData)" />
        </svg>
      </div>
    </div>

    <!-- Chart + Recent -->
    <div class="dashboard-row">
      <!-- Bar chart -->
      <div class="card chart-card">
        <div class="header">
          <div>
            <h3>Mensagens por dia</h3>
            <div style="font-size:12px;color:var(--ka-fg-muted);margin-top:2px;">Entrada, IA e atendimento humano nos últimos 7 dias</div>
          </div>
          <div class="switch">
            <span class="on">Semana</span>
            <span>Mês</span>
          </div>
        </div>

        <div v-if="loading" style="display:flex;gap:8px;align-items:flex-end;height:200px;padding-bottom:8px;">
          <div v-for="i in 7" :key="i" :style="`flex:1;height:${30+i*20}px;background:var(--ka-gray-100);border-radius:6px 6px 2px 2px;animation:pulse 1.5s infinite;`" />
        </div>

        <div v-else-if="hasChartData" style="display:flex;align-items:flex-end;gap:6px;height:214px;padding-bottom:24px;position:relative;">
          <div v-for="day in chartDays" :key="day.day" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;gap:2px;width:100%;">
              <div
                :style="`width:100%;background:var(--ka-brand);border-radius:6px 6px 2px 2px;transition:height 300ms;`"
                :title="`${day.inbound} recebidas`"
                :class="{ 'h-0': !day.inbound }"
                :style2="barH(day.inbound)"
                v-bind="{ style: `width:100%;background:var(--ka-brand);border-radius:6px 6px 2px 2px;height:${barH(day.inbound)};` }"
              />
              <div
                :style="`width:100%;background:var(--ka-bot);border-radius:2px;height:${barH(day.ai)};`"
                :title="`${day.ai} IA`"
              />
            </div>
            <small style="font-size:10px;color:var(--ka-fg-muted);">{{ shortDay(day.day) }}</small>
          </div>
        </div>

        <div v-else style="height:200px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--ka-fg-muted);">
          <Icon name="barChart" :size="32" style="opacity:0.3" />
          <span style="font-size:13px;">Sem mensagens no período</span>
        </div>

        <!-- Legend -->
        <div style="display:flex;gap:16px;padding-top:12px;border-top:1px solid var(--ka-divider);font-size:12px;color:var(--ka-fg-2);">
          <span style="display:flex;align-items:center;gap:6px;"><i style="width:10px;height:10px;border-radius:2px;background:var(--ka-brand);display:inline-block;" />Recebidas</span>
          <span style="display:flex;align-items:center;gap:6px;"><i style="width:10px;height:10px;border-radius:2px;background:var(--ka-bot);display:inline-block;" />IA</span>
        </div>
      </div>

      <!-- Recent conversations -->
      <div class="card recent-list">
        <div class="header">
          <h3>Conversas recentes</h3>
          <button class="btn ghost sm" type="button" @click="navigateTo('/inbox')">Ver todas</button>
        </div>

        <template v-if="loading">
          <div v-for="i in 5" :key="i" class="row" style="gap:12px;">
            <div style="width:36px;height:36px;border-radius:9999px;background:var(--ka-gray-100);flex-shrink:0;animation:pulse 1.5s infinite;" />
            <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
              <div style="height:13px;background:var(--ka-gray-100);border-radius:4px;width:60%;animation:pulse 1.5s infinite;" />
              <div style="height:11px;background:var(--ka-gray-100);border-radius:4px;width:80%;animation:pulse 1.5s infinite;" />
            </div>
          </div>
        </template>

        <template v-else-if="conversations.length">
          <div
            v-for="conv in conversations.slice(0, 6)"
            :key="conv.id"
            class="row"
            style="cursor:pointer;"
            @click="navigateTo(`/inbox?conversation=${conv.id}`)"
          >
            <div class="avatar" :style="`background:${avatarColor(conv.contact?.name)};width:36px;height:36px;`">
              {{ initials(conv.contact?.name || conv.contact?.phone) }}
            </div>
            <div style="flex:1;min-width:0;">
              <div class="name">{{ conv.contact?.name || conv.contact?.phone || 'Contato' }}</div>
              <div class="preview">{{ conv.lastMessage?.content || 'Sem mensagens ainda' }}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
              <span class="when">{{ relativeTime(conv.updatedAt) }}</span>
              <span v-if="conv.unreadCount" style="font-size:10px;font-weight:700;background:var(--ka-brand);color:#fff;border-radius:999px;padding:2px 7px;">{{ conv.unreadCount }}</span>
            </div>
          </div>
        </template>

        <div v-else style="padding:32px 20px;text-align:center;color:var(--ka-fg-muted);font-size:13px;">
          <Icon name="message" :size="28" style="opacity:0.3;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" />
          Nenhuma conversa ainda.<br />
          <button class="btn ghost sm" style="margin-top:10px;" @click="navigateTo('/agent')">Treinar a IA</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const auth = useAuthStore()
const loading = ref(true)
const stats = ref<any>(null)
const overview = ref<any>(null)
const messageDays = ref<any[]>([])
const conversations = ref<any[]>([])

const AVATAR_COLORS = ['#5B7FFF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'manhã'
  if (h < 18) return 'tarde'
  return 'noite'
})

const firstName = computed(() => auth.user?.name?.split(' ')?.[0] || 'time')

const chartDays = computed(() => messageDays.value.slice(-7))
const maxMessages = computed(() => Math.max(4, ...chartDays.value.map((d: any) => Math.max(Number(d.inbound || 0), Number(d.ai || 0)))))
const hasChartData = computed(() => chartDays.value.some((d: any) => Number(d.inbound || 0) + Number(d.ai || 0) > 0))

const inboundSpark = computed(() => chartDays.value.map((d: any) => Number(d.inbound || 0)))
const aiSpark = computed(() => chartDays.value.map((d: any) => Number(d.ai || 0)))

function trendPct(spark: number[]) {
  if (spark.length < 2) return 0
  const prev = spark[spark.length - 2] || 0
  const curr = spark[spark.length - 1] || 0
  if (!prev) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

const kpis = computed(() => {
  const successRate = Number(overview.value?.ai?.successRate ?? 0)
  const newLeads    = Number(overview.value?.contacts?.newLast7d ?? 0)
  const convToday   = Number(overview.value?.conversations?.today ?? 0)
  const convOpen    = Number(overview.value?.conversations?.open ?? 0)
  const contacts    = Number(stats.value?.stats?.contacts ?? 0)

  return [
    {
      label: 'Conversas hoje',
      value: String(convToday),
      note: convOpen > 0 ? `${convOpen} em aberto agora` : 'Nenhuma em aberto',
      noteClass: convOpen > 0 ? 'is-positive' : '',
      trend: trendPct(inboundSpark.value),
      sparkData: inboundSpark.value,
    },
    {
      label: 'Contatos',
      value: String(contacts),
      note: newLeads > 0 ? `+${newLeads} nos últimos 7 dias` : 'Base total',
      noteClass: newLeads > 0 ? 'is-positive' : '',
      trend: 0,
      sparkData: [] as number[],
    },
    {
      label: 'Leads novos',
      value: String(newLeads),
      note: 'Nos últimos 7 dias',
      noteClass: newLeads > 0 ? 'is-positive' : '',
      trend: 0,
      sparkData: chartDays.value.map((d: any) => Number(d.total || 0)),
    },
    {
      label: 'Respostas IA',
      value: String(overview.value?.ai?.repliesLast30d ?? 0),
      note: successRate > 0 ? `${successRate}% sem intervenção humana` : 'Últimos 30 dias',
      noteClass: successRate >= 70 ? 'is-positive' : successRate > 0 && successRate < 40 ? 'is-negative' : '',
      trend: trendPct(aiSpark.value),
      sparkData: aiSpark.value,
    },
  ]
})

function barH(value: number) {
  const n = Number(value || 0)
  if (!n) return '2px'
  return `${Math.max(6, (n / maxMessages.value) * 180)}px`
}

function shortDay(day: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${day}T12:00:00`))
}

function sparkLine(data: number[]) {
  const w = 100, h = 38
  const max = Math.max(1, ...data)
  const stepX = w / Math.max(data.length - 1, 1)
  return data.map((v, i) => `${i * stepX},${h - (v / max) * (h - 4) - 2}`).join(' ')
}

function sparkArea(data: number[]) {
  const w = 100, h = 38
  const max = Math.max(1, ...data)
  const stepX = w / Math.max(data.length - 1, 1)
  const pts = data.map((v, i) => `${i * stepX},${h - (v / max) * (h - 4) - 2}`).join(' ')
  return `0,${h} ${pts} ${w},${h}`
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function avatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0]
  const i = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[i]
}

function relativeTime(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

async function refresh() {
  loading.value = true
  try {
    const [statsRes, overviewRes, daysRes, convRes] = await Promise.all([
      api.fetch<any>('/companies/me/stats'),
      api.fetch<any>('/analytics/overview'),
      api.fetch<any>('/analytics/messages-per-day?days=7'),
      api.fetch<any>('/conversations?limit=6'),
    ])
    stats.value = statsRes
    overview.value = overviewRes
    messageDays.value = daysRes.days || []
    conversations.value = unwrapList(convRes, ['conversations'])
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
.kpi-spark {
  width: 100%;
  height: 40px;
  margin-top: 12px;
}

.kpi-note {
  font-size: 12px;
  color: var(--ka-fg-muted);
}
.kpi-note.is-positive { color: var(--ka-success); }
.kpi-note.is-negative { color: var(--ka-danger); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
