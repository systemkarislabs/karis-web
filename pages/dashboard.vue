<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Boa {{ greeting }}, {{ auth.user?.name?.split(" ")?.[0] || "time" }}</h1>
        <p class="page-subtitle">Aqui tá tudo sob controle. Hoje seu time já resolveu {{ overview?.conversations?.closed ?? 0 }} conversas.</p>
      </div>
      <div class="page-actions">
        <Button variant="secondary" size="sm" @click="refresh">
          <Icon name="refresh" :size="16" />
          Atualizar
        </Button>
        <Button size="sm" @click="navigateTo('/inbox')">
          <Icon name="plus" :size="16" />
          Nova conversa
        </Button>
      </div>
    </div>

    <div class="quick-actions">
      <button class="quick-action" type="button" @click="navigateTo('/inbox')">
        <div class="quick-action-icon"><Icon name="message" :size="20" /></div>
        <div>
          <div class="quick-action-title">Nova conversa</div>
          <div class="quick-action-desc">Abrir chat com novo contato</div>
        </div>
      </button>
      <button class="quick-action" type="button" @click="navigateTo('/crm')">
        <div class="quick-action-icon"><Icon name="kanban" :size="20" /></div>
        <div>
          <div class="quick-action-title">Ver pipeline</div>
          <div class="quick-action-desc">{{ overview?.contacts?.newLast7d ?? 0 }} leads em aberto</div>
        </div>
      </button>
      <button class="quick-action" type="button" @click="navigateTo('/agent')">
        <div class="quick-action-icon"><Icon name="sparkles" :size="20" /></div>
        <div>
          <div class="quick-action-title">Treinar a IA</div>
          <div class="quick-action-desc">Adicionar documentos</div>
        </div>
      </button>
    </div>

    <div class="kpi-grid">
      <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">{{ kpi.label }}</span>
          <Icon v-if="kpi.trend" :name="kpi.trend > 0 ? 'trendUp' : 'trendDown'" :size="16" :color="kpi.trend > 0 ? 'var(--ka-success)' : 'var(--ka-danger)'" />
        </div>
        <Skeleton v-if="loading" height="2rem" width="7rem" />
        <div v-else class="kpi-value">{{ kpi.value }}</div>
        <div class="kpi-footer">
          <span v-if="kpi.trend" class="kpi-trend" :class="kpi.trend > 0 ? 'kpi-trend-up' : 'kpi-trend-down'">
            {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}%
          </span>
          <span v-else class="kpi-note" :class="kpi.noteClass">{{ kpi.note }}</span>
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <div class="card chart-card">
        <div class="card-header">
          <div>
            <h3>Mensagens por dia</h3>
            <p class="card-subtitle">Entrada, IA e atendimento humano nos últimos 7 dias.</p>
          </div>
          <div class="period-switch">
            <span>Semana</span>
            <span class="period-switch-active">Mês</span>
          </div>
        </div>
        <div v-if="loading" class="skeleton-bars">
          <Skeleton v-for="i in 6" :key="i" height="2.5rem" />
        </div>
        <div v-else-if="hasChartData" class="chart-area">
          <div class="y-axis">
            <span>{{ maxMessages }}</span>
            <span>{{ Math.ceil(maxMessages / 2) }}</span>
            <span>0</span>
          </div>
          <div class="plot">
            <div v-for="day in chartDays" :key="day.day" class="bar-col">
              <div class="bar-stack">
                <div class="bar bar-inbound" :style="{ height: barHeight(day.inbound, maxMessages) }" :title="`${day.inbound} recebidas`" />
                <div class="bar bar-ai" :style="{ height: barHeight(day.ai, maxMessages) }" :title="`${day.ai} IA`" />
                <div class="bar bar-human" :style="{ height: barHeight(day.human, maxMessages) }" :title="`${day.human} humanas`" />
              </div>
              <span class="bar-label">{{ shortDay(day.day) }}</span>
            </div>
          </div>
        </div>
        <EmptyState v-else icon="barChart" title="Sem mensagens no período" description="Quando houver conversas no backend, o volume aparece aqui." />
      </div>

      <div class="card recent-card">
        <div class="card-header">
          <h3>Conversas recentes</h3>
          <Button variant="ghost" size="sm" @click="navigateTo('/inbox')">Ver todas</Button>
        </div>
        <div v-if="loading" class="skeleton-list">
          <Skeleton v-for="i in 5" :key="i" height="3.5rem" />
        </div>
        <template v-else-if="conversations.length">
          <div
            v-for="conv in conversations.slice(0, 6)"
            :key="conv.id"
            class="conv-row"
            @click="navigateTo(`/inbox?conversation=${conv.id}`)"
          >
            <Avatar :name="conv.contact?.name || conv.contact?.phone" size="sm" />
            <div class="conv-info">
              <div class="conv-name">{{ conv.contact?.name || conv.contact?.phone || "Contato" }}</div>
              <div class="conv-preview">{{ conv.lastMessage?.content || "Sem mensagens ainda" }}</div>
            </div>
            <div class="conv-meta">
              <span class="conv-time">{{ relativeTime(conv.updatedAt) }}</span>
              <span v-if="conv.unreadCount" class="conv-badge">{{ conv.unreadCount }}</span>
            </div>
          </div>
        </template>
        <EmptyState v-else icon="message" title="Nenhuma conversa aberta" description="Conecte o WhatsApp ou treine a IA para iniciar a operação." action-label="Treinar a IA" action-link="/agent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const auth = useAuthStore();
const loading = ref(true);
const stats = ref<any>(null);
const overview = ref<any>(null);
const messageDays = ref<any[]>([]);
const conversations = ref<any[]>([]);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "manhã";
  if (h < 18) return "tarde";
  return "noite";
});

const chartDays = computed(() => messageDays.value.slice(-7));
const inboundSpark = computed(() => chartDays.value.map((d: any) => Number(d.inbound || 0)));
const aiSpark = computed(() => chartDays.value.map((d: any) => Number(d.ai || 0)));

function trendPct(spark: number[]) {
  if (spark.length < 2) return 0;
  const prev = spark[spark.length - 2] || 0;
  const curr = spark[spark.length - 1] || 0;
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

const kpis = computed(() => {
  const successRate = Number(overview.value?.ai?.successRate ?? 0);
  const newLeads = Number(overview.value?.contacts?.newLast7d ?? 0);
  const convToday = Number(overview.value?.conversations?.today ?? 0);
  const convOpen = Number(overview.value?.conversations?.open ?? 0);
  const contacts = Number(stats.value?.stats?.contacts ?? 0);
  const convTrend = trendPct(inboundSpark.value);
  const aiTrend = trendPct(aiSpark.value);

  return [
    {
      label: "Conversas hoje",
      value: String(convToday),
      note: convOpen > 0 ? `${convOpen} em aberto agora` : "Nenhuma em aberto",
      noteClass: convOpen > 0 ? "is-positive" : "",
      trend: convTrend,
      sparkData: inboundSpark.value,
    },
    {
      label: "Contatos",
      value: String(contacts),
      note: newLeads > 0 ? `+${newLeads} nos últimos 7 dias` : "Base total",
      noteClass: newLeads > 0 ? "is-positive" : "",
      trend: 0,
      sparkData: [] as number[],
    },
    {
      label: "Leads novos",
      value: String(newLeads),
      note: "Nos últimos 7 dias",
      noteClass: newLeads > 0 ? "is-positive" : "",
      trend: 0,
      sparkData: chartDays.value.map((d: any) => Number(d.total || 0)),
    },
    {
      label: "Respostas IA",
      value: String(overview.value?.ai?.repliesLast30d ?? 0),
      note: successRate > 0 ? `${successRate}% sem intervenção humana` : "Últimos 30 dias",
      noteClass: successRate >= 70 ? "is-positive" : successRate > 0 && successRate < 40 ? "is-negative" : "",
      trend: aiTrend,
      sparkData: aiSpark.value,
    },
  ];
});

const maxMessages = computed(() => Math.max(1, ...chartDays.value.map((d: any) => Math.max(Number(d.inbound || 0), Number(d.ai || 0), Number(d.human || 0)))));
const hasChartData = computed(() => chartDays.value.some((d: any) => Number(d.inbound || 0) + Number(d.ai || 0) + Number(d.human || 0) > 0));

function barHeight(value: number, max: number) {
  const n = Number(value || 0);
  if (!n) return "0px";
  return `${Math.max(18, (n / max) * 214)}px`;
}

function shortDay(day: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${day}T12:00:00`));
}

async function refresh() {
  loading.value = true;
  try {
    const [statsRes, overviewRes, daysRes, convRes] = await Promise.all([
      api.fetch<any>("/companies/me/stats"),
      api.fetch<any>("/analytics/overview"),
      api.fetch<any>("/analytics/messages-per-day?days=7"),
      api.fetch<any>("/conversations?limit=6"),
    ]);
    stats.value = statsRes;
    overview.value = overviewRes;
    messageDays.value = daysRes.days || [];
    conversations.value = unwrapList(convRes, ["conversations"]);
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
</script>

<style scoped>
.page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--ka-fg-2);
  margin: 4px 0 0;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.quick-action:hover {
  border-color: var(--ka-brand);
  box-shadow: 0 2px 8px var(--ka-brand-alpha);
}

.quick-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--ka-r-md);
  background: var(--ka-brand-alpha);
  color: var(--ka-brand);
}

.quick-action-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ka-fg);
}

.quick-action-desc {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 2px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  padding: 20px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-surface);
}

.kpi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ka-fg-2);
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--ka-fg);
  line-height: 1;
}

.kpi-footer {
  margin-top: 8px;
  font-size: 12px;
}

.kpi-trend {
  font-weight: 600;
}

.kpi-trend-up {
  color: var(--ka-success);
}

.kpi-trend-down {
  color: var(--ka-danger);
}

.kpi-note {
  color: var(--ka-fg-3);
}

.kpi-note.is-positive {
  color: var(--ka-success);
}

.kpi-note.is-negative {
  color: var(--ka-danger);
}

.dashboard-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}

.card {
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-surface);
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
}

.card-subtitle {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin: 4px 0 0;
}

.period-switch {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  font-size: 12px;
  color: var(--ka-fg-3);
}

.period-switch-active {
  padding: 4px 10px;
  border-radius: var(--ka-r-sm);
  background: var(--ka-brand);
  color: white;
  font-weight: 600;
}

.skeleton-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.chart-area {
  display: flex;
  gap: 16px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ka-fg-3);
  padding: 0 8px 24px;
  min-width: 36px;
  text-align: right;
}

.plot {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--ka-border);
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.bar-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  max-width: 48px;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}

.bar-inbound {
  background: var(--ka-fg-3);
  opacity: 0.3;
}

.bar-ai {
  background: var(--ka-brand);
}

.bar-human {
  background: var(--ka-brand-dark);
}

.bar-label {
  font-size: 11px;
  color: var(--ka-fg-3);
}

.conv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--ka-r-md);
  cursor: pointer;
  transition: background-color 0.15s;
}

.conv-row:hover {
  background: var(--ka-gray-50);
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-preview {
  font-size: 12px;
  color: var(--ka-fg-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.conv-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.conv-time {
  font-size: 11px;
  color: var(--ka-fg-3);
}

.conv-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--ka-brand);
  color: white;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
</style>
