<template>
  <NuxtLayout name="default">
    <div class="page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Boa {{ greeting }}, {{ auth.user?.name?.split(" ")?.[0] || "time" }} ✳</h1>
          <div class="sub">Aqui tá tudo sob controle. Hoje seu time já resolveu {{ overview?.conversations?.closed ?? 0 }} conversas.</div>
        </div>
        <div style="display:flex;gap:8px;">
          <Button variant="secondary" size="sm" @click="refresh">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm" @click="navigateTo('/inbox')">
            <Plus class="h-4 w-4" />
            Nova conversa
          </Button>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="quick-actions">
        <button class="quick" type="button" @click="navigateTo('/inbox')">
          <div class="ico"><MessageSquare class="h-5 w-5" /></div>
          <div>
            <div class="title">Nova conversa</div>
            <div class="desc">Abrir chat com novo contato</div>
          </div>
        </button>
        <button class="quick" type="button" @click="navigateTo('/crm')">
          <div class="ico"><Kanban class="h-5 w-5" /></div>
          <div>
            <div class="title">Ver pipeline</div>
            <div class="desc">{{ overview?.contacts?.newLast7d ?? 0 }} leads em aberto</div>
          </div>
        </button>
        <button class="quick" type="button" @click="navigateTo('/agent')">
          <div class="ico"><Sparkles class="h-5 w-5" /></div>
          <div>
            <div class="title">Treinar a IA</div>
            <div class="desc">Adicionar documentos</div>
          </div>
        </button>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi">
          <div class="label">{{ kpi.label }}</div>
          <Skeleton v-if="loading" class="mt-3" height="2rem" width="7rem" />
          <div v-else class="value">{{ kpi.value }}</div>
          <div class="delta">
            <span v-if="kpi.trend" class="kpi-badge" :class="kpi.trend > 0 ? 'is-success' : 'is-danger'">
              <component :is="kpi.trend > 0 ? TrendingUp : TrendingDown" class="h-3 w-3" />
              {{ kpi.trendLabel }}
            </span>
            <span v-else class="kpi-note" :class="kpi.noteClass">{{ kpi.note }}</span>
          </div>
          <Sparkline v-if="!loading && kpi.sparkData.length > 1" :data="kpi.sparkData" :color="kpi.trend < 0 ? 'var(--ka-danger)' : 'var(--ka-brand)'" class="dashboard-kpi-spark" />
        </div>
      </div>

      <!-- Chart + Recent -->
      <div class="dashboard-row">
        <div class="card chart-card">
          <div class="header">
            <div>
              <h3>Mensagens por dia</h3>
              <div style="font-size:12px;color:var(--ka-fg-muted);margin-top:2px;">Entrada, IA e atendimento humano nos últimos 7 dias.</div>
            </div>
            <div class="switch">
              <span>Semana</span>
              <span class="on">Mês</span>
            </div>
          </div>
          <div v-if="loading" class="space-y-3">
            <Skeleton v-for="i in 6" :key="i" height="2.5rem" />
          </div>
          <div v-else-if="hasChartData" class="dashboard-chart" :aria-label="chartSummary">
            <div class="dashboard-y-axis" aria-hidden="true">
              <span>{{ maxMessages }}</span>
              <span>{{ Math.ceil(maxMessages / 2) }}</span>
              <span>0</span>
            </div>
            <div class="dashboard-plot">
              <div v-for="day in chartDays" :key="day.day" class="dashboard-bar-col">
                <div class="dashboard-bar-stack">
                  <i class="is-inbound" :style="{ height: barHeight(day.inbound, maxMessages) }" :title="`${day.inbound} recebidas`" />
                  <i class="is-ai" :style="{ height: barHeight(day.ai, maxMessages) }" :title="`${day.ai} IA`" />
                  <i class="is-human" :style="{ height: barHeight(day.human, maxMessages) }" :title="`${day.human} humanas`" />
                </div>
                <small>{{ shortDay(day.day) }}</small>
              </div>
            </div>
          </div>
          <EmptyState v-else :icon="BarChart3" title="Sem mensagens no período" description="Quando houver conversas no backend, o volume aparece aqui." />
        </div>

        <div class="card recent-list">
          <div class="header">
            <h3>Conversas recentes</h3>
            <Button variant="ghost" size="sm" @click="navigateTo('/inbox')">Ver todas</Button>
          </div>
          <div v-if="loading" class="space-y-3" style="padding:16px;">
            <Skeleton v-for="i in 5" :key="i" height="3.5rem" />
          </div>
          <template v-else-if="conversations.length">
            <div
              v-for="conv in conversations.slice(0, 6)"
              :key="conv.id"
              class="row"
              style="cursor:pointer;"
              @click="navigateTo(`/inbox?conversation=${conv.id}`)"
            >
              <Avatar :name="conv.contact?.name || conv.contact?.phone" size="sm" />
              <div style="flex:1;min-width:0;">
                <div class="name">{{ conv.contact?.name || conv.contact?.phone || "Contato" }}</div>
                <div class="preview">{{ conv.lastMessage?.content || "Sem mensagens ainda" }}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                <span class="when">{{ relativeTime(conv.updatedAt) }}</span>
                <span v-if="conv.unreadCount" style="font-size:10px;font-weight:700;background:var(--ka-brand);color:#fff;border-radius:999px;padding:2px 7px;">{{ conv.unreadCount }}</span>
              </div>
            </div>
          </template>
          <EmptyState v-else :icon="MessageSquare" title="Nenhuma conversa aberta" description="Conecte o WhatsApp ou treine a IA para iniciar a operação." action-label="Treinar a IA" action-link="/agent" style="padding:2rem;" />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { BarChart3, Bot, Kanban, MessageSquare, Plus, RefreshCw, Sparkles, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-vue-next";

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
const aiSpark      = computed(() => chartDays.value.map((d: any) => Number(d.ai || 0)));

function trendPct(spark: number[]) {
  if (spark.length < 2) return 0;
  const prev = spark[spark.length - 2] || 0;
  const curr = spark[spark.length - 1] || 0;
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

const kpis = computed(() => {
  const successRate  = Number(overview.value?.ai?.successRate ?? 0);
  const newLeads     = Number(overview.value?.contacts?.newLast7d ?? 0);
  const convToday    = Number(overview.value?.conversations?.today ?? 0);
  const convOpen     = Number(overview.value?.conversations?.open ?? 0);
  const contacts     = Number(stats.value?.stats?.contacts ?? 0);
  const convTrend    = trendPct(inboundSpark.value);
  const aiTrend      = trendPct(aiSpark.value);

  return [
    {
      label: "Conversas hoje",
      value: String(convToday),
      note: convOpen > 0 ? `${convOpen} em aberto agora` : "Nenhuma em aberto",
      noteClass: convOpen > 0 ? "is-positive" : "",
      trend: convTrend,
      trendLabel: `${Math.abs(convTrend)}%`,
      sparkData: inboundSpark.value,
    },
    {
      label: "Contatos",
      value: String(contacts),
      note: newLeads > 0 ? `+${newLeads} nos últimos 7 dias` : "Base total",
      noteClass: newLeads > 0 ? "is-positive" : "",
      trend: 0,
      trendLabel: "",
      sparkData: [] as number[],
    },
    {
      label: "Leads novos",
      value: String(newLeads),
      note: "Nos últimos 7 dias",
      noteClass: newLeads > 0 ? "is-positive" : "",
      trend: 0,
      trendLabel: "",
      sparkData: chartDays.value.map((d: any) => Number(d.total || 0)),
    },
    {
      label: "Respostas IA",
      value: String(overview.value?.ai?.repliesLast30d ?? 0),
      note: successRate > 0 ? `${successRate}% sem intervenção humana` : "Últimos 30 dias",
      noteClass: successRate >= 70 ? "is-positive" : successRate > 0 && successRate < 40 ? "is-negative" : "",
      trend: aiTrend,
      trendLabel: `${Math.abs(aiTrend)}%`,
      sparkData: aiSpark.value,
    },
  ];
});

const maxMessages = computed(() => Math.max(1, ...chartDays.value.map((d: any) => Math.max(Number(d.inbound || 0), Number(d.ai || 0), Number(d.human || 0)))));
const hasChartData = computed(() => chartDays.value.some((d: any) => Number(d.inbound || 0) + Number(d.ai || 0) + Number(d.human || 0) > 0));
const chartSummary = computed(() => `Gráfico dos últimos ${chartDays.value.length} dias. Pico de ${maxMessages.value} mensagens.`);

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
