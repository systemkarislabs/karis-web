<template>
  <NuxtLayout name="default">
    <div class="ka-page" style="max-width:1200px">

      <!-- Header -->
      <div class="page-header">
        <div>
          <p class="page-header-eyebrow">Relatórios</p>
          <h1>Visão de desempenho</h1>
          <p class="page-header-description">Conversas, mensagens e IA nos últimos 30 dias.</p>
        </div>
        <div class="page-header-actions">
          <Button variant="secondary" size="sm" @click="loadReports" :disabled="loading">
            <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            Atualizar
          </Button>
        </div>
      </div>

      <!-- KPI cards -->
      <div class="dashboard-kpis" style="margin-bottom:20px">
        <div class="dashboard-kpi" v-for="kpi in kpis" :key="kpi.label">
          <p>{{ kpi.label }}</p>
          <Skeleton v-if="loading" class="mt-3" height="2rem" width="5rem" />
          <strong v-else>{{ kpi.value }}</strong>
          <div class="dashboard-kpi-icon">
            <component :is="kpi.icon" class="h-5 w-5" />
          </div>
        </div>
      </div>

      <!-- Chart + recent -->
      <div class="dashboard-content-grid" style="margin-bottom:20px">
        <!-- Bar chart -->
        <div class="dashboard-panel dashboard-chart-panel">
          <div class="dashboard-panel-header">
            <div>
              <h2>Mensagens por dia</h2>
              <p>Entrada, IA e atendimento humano nos últimos 7 dias.</p>
            </div>
            <div class="dashboard-legend">
              <span><i class="is-inbound" style="width:9px;height:9px;border-radius:99px;display:inline-block" />Recebidas</span>
              <span><i class="is-ai" style="width:9px;height:9px;border-radius:99px;display:inline-block;background:var(--ka-brand)" />IA</span>
              <span><i class="is-human" style="width:9px;height:9px;border-radius:99px;display:inline-block;background:var(--ka-success)" />Humanas</span>
            </div>
          </div>
          <div v-if="loading" class="dashboard-chart">
            <Skeleton height="100%" />
          </div>
          <div v-else class="dashboard-chart">
            <div class="dashboard-y-axis">
              <span v-for="y in yAxis" :key="y">{{ y }}</span>
            </div>
            <div class="dashboard-plot">
              <div v-for="col in chartCols" :key="col.day" class="dashboard-bar-col">
                <div class="dashboard-bar-stack">
                  <i class="is-inbound" :style="{ height: `${col.hIn}px` }" />
                  <i class="is-ai" :style="{ height: `${col.hAi}px`, background: 'var(--ka-brand)' }" />
                  <i class="is-human" :style="{ height: `${col.hHuman}px`, background: 'var(--ka-success)' }" />
                </div>
                <small>{{ col.label }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Top summary -->
        <div class="dashboard-panel">
          <div class="dashboard-panel-header">
            <div>
              <h2>Resumo do período</h2>
              <p>Totais acumulados — 30 dias.</p>
            </div>
          </div>
          <div v-if="loading">
            <Skeleton v-for="i in 5" :key="i" class="mb-3" height="2.5rem" />
          </div>
          <dl v-else style="display:grid;gap:10px">
            <div v-for="item in summaryItems" :key="item.label"
              style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;background:var(--ka-gray-50)">
              <span style="font-size:13px;color:var(--ka-fg-2);display:flex;align-items:center;gap:8px">
                <component :is="item.icon" class="h-4 w-4" style="color:var(--ka-brand)" />
                {{ item.label }}
              </span>
              <strong style="font-size:16px;color:var(--ka-fg)">{{ item.value }}</strong>
            </div>
          </dl>
        </div>
      </div>

      <!-- Table -->
      <div class="dashboard-panel">
        <div class="dashboard-panel-header">
          <div>
            <h2>Mensagens por dia — 30 dias</h2>
            <p>Detalhamento diário de todas as mensagens.</p>
          </div>
        </div>
        <div v-if="loading" style="padding:0 20px 20px">
          <Skeleton v-for="i in 8" :key="i" class="mb-2" height="2.5rem" />
        </div>
        <div v-else-if="tableRows.length === 0" style="padding:32px;text-align:center;color:var(--ka-fg-muted);font-size:14px">
          Sem dados no período.
        </div>
        <table v-else style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid var(--ka-border)">
              <th v-for="col in columns" :key="col.key"
                style="padding:10px 20px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ka-fg-muted)">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in tableRows" :key="i"
              style="border-bottom:1px solid var(--ka-divider);transition:background 140ms"
              @mouseover="($event.currentTarget as HTMLElement).style.background = 'var(--ka-gray-50)'"
              @mouseleave="($event.currentTarget as HTMLElement).style.background = ''">
              <td v-for="col in columns" :key="col.key" style="padding:11px 20px;color:var(--ka-fg)">
                <span v-if="col.key === 'day'" style="font-weight:600">{{ row[col.key] }}</span>
                <span v-else-if="col.key === 'total'" style="font-weight:700;color:var(--ka-brand)">{{ row[col.key] }}</span>
                <span v-else>{{ row[col.key] }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { BarChart3, Bot, MessageSquare, RefreshCw, Users } from "lucide-vue-next";

definePageMeta({ middleware: "auth" });

const api = useApi();
const loading = ref(true);
const overview = ref<any>({});
const days = ref<any[]>([]);

// KPI cards
const kpis = computed(() => [
  { label: "Conversas totais",  value: overview.value.conversations?.total  ?? 0, icon: MessageSquare },
  { label: "Conversas abertas", value: overview.value.conversations?.open   ?? 0, icon: Users },
  { label: "Mensagens 30d",     value: overview.value.messages?.last30d     ?? 0, icon: BarChart3 },
  { label: "Sucesso IA",        value: `${overview.value.ai?.successRate    ?? 0}%`, icon: Bot },
]);

// Table
const columns = [
  { key: "day",     label: "Dia" },
  { key: "inbound", label: "Recebidas" },
  { key: "ai",      label: "IA" },
  { key: "human",   label: "Humanas" },
  { key: "total",   label: "Total" },
];

const tableRows = computed(() =>
  [...days.value].reverse().map((d) => ({
    day:     formatDate(d.day),
    inbound: d.inbound ?? 0,
    ai:      d.ai      ?? 0,
    human:   d.human   ?? 0,
    total:   (d.inbound ?? 0) + (d.ai ?? 0) + (d.human ?? 0),
  }))
);

// Chart — last 7 days
const MAX_BAR = 235;
const chartCols = computed(() => {
  const last7 = days.value.slice(-7);
  const peak = Math.max(1, ...last7.map((d) => (d.inbound ?? 0) + (d.ai ?? 0) + (d.human ?? 0)));
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return last7.map((d) => {
    const total = (d.inbound ?? 0) + (d.ai ?? 0) + (d.human ?? 0);
    const scale = MAX_BAR / peak;
    const date = new Date(d.day);
    return {
      day:    d.day,
      label:  labels[date.getDay()] ?? "--",
      hIn:    Math.max(4, Math.round((d.inbound ?? 0) * scale)),
      hAi:    Math.max(4, Math.round((d.ai      ?? 0) * scale)),
      hHuman: Math.max(4, Math.round((d.human   ?? 0) * scale)),
      total,
    };
  });
});

const yAxis = computed(() => {
  const peak = Math.max(1, ...days.value.slice(-7).map((d) => (d.inbound ?? 0) + (d.ai ?? 0) + (d.human ?? 0)));
  const step = Math.ceil(peak / 3);
  return [peak, Math.ceil(peak * 0.67), Math.ceil(peak * 0.33), 0].map((v) => v.toString());
});

// Summary
const summaryItems = computed(() => {
  const d = days.value;
  const total30 = d.reduce((s, r) => s + (r.inbound ?? 0) + (r.ai ?? 0) + (r.human ?? 0), 0);
  const aiTotal = d.reduce((s, r) => s + (r.ai ?? 0), 0);
  const humanTotal = d.reduce((s, r) => s + (r.human ?? 0), 0);
  return [
    { label: "Total de mensagens",   value: total30,    icon: MessageSquare },
    { label: "Respondidas pela IA",  value: aiTotal,    icon: Bot },
    { label: "Respondidas por humano", value: humanTotal, icon: Users },
    { label: "Taxa de automação",    value: total30 > 0 ? `${Math.round((aiTotal / total30) * 100)}%` : "0%", icon: BarChart3 },
  ];
});

async function loadReports() {
  loading.value = true;
  try {
    const [overviewRes, daysRes] = await Promise.all([
      api.fetch<any>("/analytics/overview"),
      api.fetch<any>("/analytics/messages-per-day?days=30"),
    ]);
    overview.value = overviewRes;
    days.value = daysRes.days || [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadReports);
</script>
