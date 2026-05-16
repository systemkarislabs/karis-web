<template>
  <div class="dashboard-page">
    <div class="dashboard-hero">
      <div>
        <h1>Boa {{ greeting }}, {{ auth.user?.name?.split(" ")?.[0] || "time" }}</h1>
        <p>Aqui tá tudo sob controle. Hoje seu time já resolveu {{ overview?.conversations?.closed ?? 0 }} conversas.</p>
      </div>
      <div class="dashboard-actions">
        <button class="btn secondary sm" type="button" @click="refresh">
          <Icon name="refresh" :size="16" />
          Atualizar
        </button>
        <button class="btn primary sm" type="button" @click="navigateTo('/inbox')">
          <Icon name="plus" :size="16" />
          Nova conversa
        </button>
      </div>
    </div>

    <div class="dashboard-shortcuts">
      <button class="dashboard-shortcut" type="button" @click="navigateTo('/inbox')">
        <div class="dashboard-shortcut-ico"><Icon name="message" :size="20" /></div>
        <div class="dashboard-shortcut-text">
          <strong>Nova conversa</strong>
          <small>Abrir chat com novo contato</small>
        </div>
      </button>
      <button class="dashboard-shortcut" type="button" @click="navigateTo('/crm')">
        <div class="dashboard-shortcut-ico"><Icon name="kanban" :size="20" /></div>
        <div class="dashboard-shortcut-text">
          <strong>Ver pipeline</strong>
          <small>{{ overview?.contacts?.newLast7d ?? 0 }} leads em aberto</small>
        </div>
      </button>
      <button class="dashboard-shortcut" type="button" @click="navigateTo('/agent')">
        <div class="dashboard-shortcut-ico"><Icon name="sparkles" :size="20" /></div>
        <div class="dashboard-shortcut-text">
          <strong>Treinar a IA</strong>
          <small>Adicionar documentos</small>
        </div>
      </button>
    </div>

    <div class="dashboard-kpis">
      <div v-for="kpi in kpis" :key="kpi.label" class="dashboard-kpi">
        <span class="dashboard-kpi-label">{{ kpi.label }}</span>
        <Skeleton v-if="loading" height="2rem" width="7rem" />
        <strong v-else class="dashboard-kpi-value">{{ kpi.value }}</strong>
        <div class="dashboard-kpi-delta">
          <span v-if="kpi.trend" class="kpi-badge" :class="kpi.trend > 0 ? 'is-success' : 'is-danger'">
            <Icon :name="kpi.trend > 0 ? 'trendUp' : 'trendDown'" :size="12" />
            {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}%
          </span>
          <span v-else class="kpi-note" :class="kpi.noteClass">{{ kpi.note }}</span>
        </div>
        <svg v-if="kpi.sparkData.length > 1" class="dashboard-kpi-spark" viewBox="0 0 100 32" preserveAspectRatio="none">
          <polyline fill="none" stroke="var(--ka-brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            :points="sparkPoints(kpi.sparkData)" />
        </svg>
      </div>
    </div>

    <div class="dashboard-content-grid">
      <div class="dashboard-panel">
        <div class="dashboard-panel-header">
          <div>
            <h2>Mensagens por dia</h2>
            <p>Entrada, IA e atendimento humano nos últimos 7 dias.</p>
          </div>
          <div class="dashboard-segment">
            <span>Semana</span>
            <span>Mês</span>
          </div>
        </div>
        <div v-if="loading" style="display:flex;flex-direction:column;gap:12px;padding:16px">
          <Skeleton v-for="i in 6" :key="i" height="2.5rem" />
        </div>
        <div v-else-if="hasChartData" class="dashboard-bars">
          <div v-for="day in chartDays" :key="day.day" class="dashboard-bar-col">
            <div class="dashboard-bar-stack">
              <i class="is-inbound" :style="{ height: barHeight(day.inbound, maxMessages) }" :title="`${day.inbound} recebidas`" />
              <i class="is-ai" :style="{ height: barHeight(day.ai, maxMessages) }" :title="`${day.ai} IA`" />
              <i class="is-human" :style="{ height: barHeight(day.human, maxMessages) }" :title="`${day.human} humanas`" />
            </div>
            <small>{{ shortDay(day.day) }}</small>
          </div>
        </div>
        <EmptyState v-else icon="barChart" title="Sem mensagens no período" description="Quando houver conversas no backend, o volume aparece aqui." />
      </div>

      <div class="dashboard-panel dashboard-recent-panel">
        <div class="dashboard-panel-header">
          <h2>Conversas recentes</h2>
          <button class="btn ghost sm" type="button" @click="navigateTo('/inbox')">Ver todas</button>
        </div>
        <div v-if="loading" style="display:flex;flex-direction:column;gap:12px;padding:16px">
          <Skeleton v-for="i in 5" :key="i" height="3.5rem" />
        </div>
        <template v-else-if="conversations.length">
          <div class="dashboard-conversation-list">
            <button
              v-for="conv in conversations.slice(0, 6)"
              :key="conv.id"
              class="dashboard-conversation"
              type="button"
              @click="navigateTo(`/inbox?conversation=${conv.id}`)"
            >
              <Avatar :name="conv.contact?.name || conv.contact?.phone" size="sm" />
              <span>
                <strong>{{ conv.contact?.name || conv.contact?.phone || "Contato" }}</strong>
                <small>{{ conv.lastMessage?.content || "Sem mensagens ainda" }}</small>
              </span>
              <div class="dashboard-conv-meta">
                <small>{{ relativeTime(conv.updatedAt) }}</small>
                <span v-if="conv.unreadCount" class="dashboard-unread">{{ conv.unreadCount }}</span>
              </div>
            </button>
          </div>
        </template>
        <EmptyState v-else icon="message" title="Nenhuma conversa aberta" description="Conecte o WhatsApp ou treine a IA para iniciar a operação." action-label="Treinar a IA" action-link="/agent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

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

function sparkPoints(data: number[]) {
  const w = 100, h = 32;
  const max = Math.max(1, ...data);
  const stepX = w / Math.max(data.length - 1, 1);
  return data.map((v, i) => `${i * stepX},${h - (v / max) * (h - 4) - 2}`).join(" ");
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

