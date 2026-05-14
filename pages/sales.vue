<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="Vendas" description="Forecast e funil com base nos negÃ³cios reais do CRM.">
        <template #actions>
          <Button variant="secondary" size="sm" @click="loadSales"><RefreshCw class="h-4 w-4" />Atualizar</Button>
        </template>
      </PageHeader>
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card v-for="kpi in kpis" :key="kpi.label">
          <p class="text-sm text-[--ka-fg-2]">{{ kpi.label }}</p>
          <Skeleton v-if="loading" class="mt-3" height="2rem" width="7rem" />
          <p v-else class="mt-2 text-3xl font-bold">{{ kpi.value }}</p>
        </Card>
      </div>
      <Table :columns="columns" :rows="rows" :loading="loading" empty-title="Nenhuma venda em aberto" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
definePageMeta({ layout: false, middleware: "auth" });
const api = useApi();
const loading = ref(true);
const forecast = ref<any>({});
const funnel = ref<any[]>([]);
const columns = [
  { key: "stage", label: "Etapa" },
  { key: "count", label: "NegÃ³cios" },
  { key: "value", label: "Valor" },
];
const kpis = computed(() => [
  { label: "Receita prevista", value: formatMoney(forecast.value.weightedForecast) },
  { label: "Deals ativos", value: String(forecast.value.deals ?? 0) },
  { label: "Valor aberto", value: formatMoney(forecast.value.totalValue) },
]);
const rows = computed(() => funnel.value.map(f => ({ stage: f.stage, count: f.count, value: formatMoney(f.value) })));
async function loadSales() {
  loading.value = true;
  try {
    const [forecastRes, funnelRes] = await Promise.all([api.fetch<any>("/sales/forecast"), api.fetch<any>("/sales/funnel")]);
    forecast.value = forecastRes;
    funnel.value = funnelRes.funnel || [];
  } finally { loading.value = false; }
}
onMounted(loadSales);
</script>
