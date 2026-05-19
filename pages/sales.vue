<template>
    <div class="ka-page" style="max-width:1100px">

      <!-- Header -->
      <div class="page-header">
        <div>
          <p class="page-header-eyebrow">CRM</p>
          <h1>Vendas</h1>
          <p class="page-header-description">Forecast e funil com base nos negócios do pipeline.</p>
        </div>
        <div class="page-header-actions">
          <Button variant="secondary" size="sm" @click="load" :disabled="loading">
            <RefreshCw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            Atualizar
          </Button>
          <Button size="sm" @click="navigateTo('/crm')">
            <Kanban class="h-4 w-4" />
            Ver CRM
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

      <!-- Funnel table -->
      <div class="dashboard-panel">
        <div class="dashboard-panel-header">
          <div>
            <h2>Funil por estágio</h2>
            <p>Negócios abertos agrupados por etapa do pipeline.</p>
          </div>
        </div>

        <div v-if="loading" style="padding:0 20px 20px;display:flex;flex-direction:column;gap:8px">
          <Skeleton v-for="i in 5" :key="i" height="44px" style="border-radius:8px" />
        </div>

        <div v-else-if="funnel.length === 0" style="padding:48px 32px;text-align:center;color:var(--ka-fg-muted);font-size:14px">
          Nenhum negócio aberto encontrado. <NuxtLink to="/crm" style="color:var(--ka-brand)">Acesse o CRM</NuxtLink> para criar negócios.
        </div>

        <div v-else style="padding:0 20px 20px">
          <!-- Progress bars -->
          <div v-for="row in funnelWithPct" :key="row.stage" style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="width:10px;height:10px;border-radius:50%;flex-shrink:0" :style="{ background: row.color || 'var(--ka-brand)' }" />
                <span style="font-size:14px;font-weight:600;color:var(--ka-fg)">{{ row.stage }}</span>
                <span style="font-size:12px;color:var(--ka-fg-muted)">{{ row.count }} negócio{{ row.count !== 1 ? 's' : '' }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:16px">
                <span style="font-size:14px;font-weight:700;color:var(--ka-fg)">{{ formatMoney(row.value) }}</span>
                <span style="font-size:12px;color:var(--ka-fg-muted);min-width:36px;text-align:right">{{ row.pct }}%</span>
              </div>
            </div>
            <div style="height:8px;border-radius:99px;background:var(--ka-gray-100);overflow:hidden">
              <div
                style="height:100%;border-radius:99px;transition:width 0.6s ease"
                :style="{ width: `${row.pct}%`, background: row.color || 'var(--ka-brand)' }"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
</template>

<script setup lang="ts">
import { BarChart3, DollarSign, Kanban, RefreshCw, TrendingUp } from "lucide-vue-next";

definePageMeta({ middleware: "auth" });

const api = useApi();
const loading = ref(true);
const forecast = ref<any>({});
const funnel = ref<any[]>([]);

const kpis = computed(() => [
  { label: "Deals ativos",     value: String(forecast.value.deals ?? 0),           icon: Kanban },
  { label: "Valor em aberto",  value: formatMoney(forecast.value.totalValue ?? 0),  icon: DollarSign },
  { label: "Valor ganho",      value: formatMoney(forecast.value.wonValue ?? 0),    icon: TrendingUp },
  { label: "Forecast",         value: formatMoney(forecast.value.weightedForecast ?? 0), icon: BarChart3 },
]);

const funnelWithPct = computed(() => {
  const maxValue = Math.max(1, ...funnel.value.map(r => r.value));
  return funnel.value.map(r => ({
    ...r,
    pct: Math.round((r.value / maxValue) * 100) || (r.count > 0 ? 5 : 0),
  }));
});

async function load() {
  loading.value = true;
  try {
    const [forecastRes, funnelRes] = await Promise.all([
      api.fetch<any>("/sales/forecast"),
      api.fetch<any>("/sales/funnel"),
    ]);
    forecast.value = forecastRes;
    funnel.value = funnelRes.funnel || [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
