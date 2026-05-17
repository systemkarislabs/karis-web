<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Boa {{ greeting }}, {{ firstName }} ☀</h1>
        <div class="sub">Aqui tá tudo sob controle. Hoje seu time já resolveu {{ overview?.conversations?.closed ?? 0 }} conversas.</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn secondary" type="button" @click="cyclePeriod">
          <Icon name="calendar" :size="16" />
          {{ periodLabel }}
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
        <svg v-if="kpi.sparkData.length > 1 && kpi.sparkData.some(v => v > 0)" class="kpi-spark" viewBox="0 0 100 36" preserveAspectRatio="none">
          <defs>
            <linearGradient :id="sparkId(kpi.label)" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#2D5BFF" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#2D5BFF" stop-opacity="0" />
            </linearGradient>
          </defs>
          <polygon :points="sparkPoints(kpi.sparkData).area" :fill="`url(#${sparkId(kpi.label)})`" />
          <polyline fill="none" stroke="#2D5BFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            :points="sparkPoints(kpi.sparkData).line" />
        </svg>
      </div>
    </div>

    <!-- Chart + Recent -->
    <div class="dashboard-row">
      <!-- Bar chart -->
      <div class="card chart-card">
        <div class="header">
          <div>
            <h3>Conversas por dia</h3>
            <div style="font-size:12px;color:var(--ka-fg-muted);margin-top:2px;">Últimos 7 dias · total de mensagens</div>
          </div>
          <div class="switch">
            <span :class="{ on: chartView === 'hora' }" @click="chartView = 'hora'">7d</span>
            <span :class="{ on: chartView === 'dia' }"  @click="chartView = 'dia'">14d</span>
            <span :class="{ on: chartView === 'semana' }" @click="chartView = 'semana'">30d</span>
          </div>
        </div>

        <!-- Skeleton -->
        <div v-if="loading" class="chart-area">
          <div class="chart-grid">
            <div v-for="i in 4" :key="i" class="chart-grid-line" />
          </div>
          <div class="chart-bars">
            <div v-for="i in 7" :key="i" class="chart-bar-col">
              <div class="chart-bar-wrap" style="justify-content:flex-end;">
                <div :style="`width:28px;height:${25+i*18}px;background:var(--ka-gray-100);border-radius:5px 5px 2px 2px;animation:pulse 1.5s infinite;`" />
              </div>
              <div class="chart-bar-label" style="background:var(--ka-gray-100);width:24px;height:10px;border-radius:3px;animation:pulse 1.5s infinite;" />
            </div>
          </div>
        </div>

        <!-- Data -->
        <div v-else-if="hasChartData" class="chart-area">
          <div class="chart-grid">
            <div v-for="i in 4" :key="i" class="chart-grid-line" />
          </div>
          <div class="chart-bars">
            <div
              v-for="day in chartDays"
              :key="day.day"
              class="chart-bar-col"
            >
              <div class="chart-bar-wrap">
                <div
                  class="chart-bar"
                  :style="`height:${barH(Number(day.inbound||0)+Number(day.ai||0), maxMessages)}px`"
                  :title="`${day.inbound} recebidas · ${day.ai} IA`"
                />
              </div>
              <span class="chart-bar-label">{{ shortDay(day.day) }}</span>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="chart-area" style="align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--ka-fg-muted);">
          <Icon name="barChart" :size="28" style="opacity:0.25" />
          <span style="font-size:13px;">Sem dados no período</span>
        </div>

        <!-- Legend -->
        <div style="display:flex;gap:16px;padding-top:10px;border-top:1px solid var(--ka-divider);font-size:12px;color:var(--ka-fg-2);">
          <span style="display:flex;align-items:center;gap:5px;">
            <i style="width:10px;height:10px;border-radius:3px;background:var(--ka-brand);display:inline-block;" />
            Total de mensagens
          </span>
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
const toast = useToast()
const loading = ref(true)
const stats = ref<any>(null)
const overview = ref<any>(null)
const messageDays = ref<any[]>([])
const conversations = ref<any[]>([])

const AVATAR_COLORS = ['#5B7FFF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

const chartView = ref<'hora' | 'dia' | 'semana'>('hora')

const PERIODS = ['Últimos 7 dias', 'Últimos 14 dias', 'Últimos 30 dias'] as const
const periodIdx = ref(0)
const periodLabel = computed(() => PERIODS[periodIdx.value])
function cyclePeriod() {
  periodIdx.value = (periodIdx.value + 1) % PERIODS.length
  refresh()
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'manhã'
  if (h < 18) return 'tarde'
  return 'noite'
})

const firstName = computed(() => auth.user?.name?.split(' ')?.[0] || 'time')

const chartDays = computed(() => messageDays.value.slice(-7))
const maxMessages = computed(() => Math.max(4, ...chartDays.value.map((d: any) => Number(d.inbound || 0) + Number(d.ai || 0))))
const hasChartData = computed(() => chartDays.value.some((d: any) => Number(d.inbound || 0) + Number(d.ai || 0) > 0))

const inboundSpark = computed(() => chartDays.value.map((d: any) => Number(d.inbound || 0)))
const aiSpark = computed(() => chartDays.value.map((d: any) => Number(d.ai || 0)))

function trendPct(spark: number[]) {
  if (spark.length < 2) return 0
  const prev = spark[spark.length - 2] || 0
  const curr = spark[spark.length - 1] || 0
  if (!curr) return 0  // hide trend badge when today is zero
  if (!prev) return curr > 0 ? 100 : 0
  const pct = Math.round(((curr - prev) / prev) * 100)
  return Math.max(-99, Math.min(999, pct))  // clamp to readable range
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

function barH(value: number, maxVal: number) {
  const n = Number(value || 0)
  const pct = maxVal > 0 ? n / maxVal : 0
  return Math.max(pct > 0 ? 4 : 0, pct * 160)
}

function shortDay(day: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${day}T12:00:00`))
}

// SVG IDs must not contain spaces — sanitize the label
function sparkId(label: string) {
  return 'sg-' + label.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '')
}

// Sparkline uses min-max normalization (like the prototype) so even small
// variations fill the chart height — avoids flat lines when values are close.
function sparkPoints(data: number[]) {
  if (data.length < 2) return { line: '', area: '' }
  const w = 100, h = 36
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })
  return {
    line: pts.join(' '),
    area: `0,${h} ${pts.join(' ')} ${w},${h}`,
  }
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
    const [statsRes, overviewRes, daysRes, convRes] = await Promise.allSettled([
      api.fetch<any>('/companies/me/stats'),
      api.fetch<any>('/analytics/overview'),
      api.fetch<any>('/analytics/messages-per-day?days=7'),
      api.fetch<any>('/conversations?limit=6'),
    ])

    if (statsRes.status === 'fulfilled') stats.value = statsRes.value
    if (overviewRes.status === 'fulfilled') overview.value = overviewRes.value
    if (daysRes.status === 'fulfilled') messageDays.value = (daysRes.value as any).days || []
    if (convRes.status === 'fulfilled') conversations.value = unwrapList(convRes.value, ['conversations'])

    const failed = [statsRes, overviewRes, daysRes, convRes].filter(r => r.status === 'rejected')
    if (failed.length === 4) toast.error('Não foi possível carregar os dados. Verifique sua conexão.')
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

/* ── Bar chart ── */
.chart-area {
  position: relative;
  height: 180px;
  display: flex;
  flex-direction: column;
  margin: 14px 0 4px;
}

.chart-grid {
  position: absolute;
  inset: 0 0 20px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.chart-grid-line {
  border-top: 1px dashed var(--ka-border);
  width: 100%;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 100%;
  padding-bottom: 20px;
}

.chart-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
  min-width: 0;
}

.chart-bar-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}

.chart-bar {
  width: 28px;
  max-width: 100%;
  background: var(--ka-brand);
  border-radius: 5px 5px 2px 2px;
  transition: height 300ms ease;
  min-height: 0;
}

.chart-bar-label {
  font-size: 10px;
  color: var(--ka-fg-muted);
  line-height: 1;
  white-space: nowrap;
}
</style>
