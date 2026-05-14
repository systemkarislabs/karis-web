<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="RelatÃ³rios" description="VisÃ£o consolidada de conversas, mensagens e IA.">
        <template #actions><Button variant="secondary" size="sm" @click="loadReports"><RefreshCw class="h-4 w-4" />Atualizar</Button></template>
      </PageHeader>
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card v-for="card in cards" :key="card.label">
          <p class="text-sm text-[--ka-fg-2]">{{ card.label }}</p>
          <Skeleton v-if="loading" class="mt-3" height="2rem" width="6rem" />
          <p v-else class="mt-2 text-3xl font-bold">{{ card.value }}</p>
        </Card>
      </div>
      <Table :columns="columns" :rows="rows" :loading="loading" empty-title="Sem mensagens no perÃ­odo" />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
definePageMeta({ layout: false, middleware: "auth" });
const api = useApi();
const loading = ref(true);
const overview = ref<any>({});
const days = ref<any[]>([]);
const cards = computed(() => [
  { label: "Conversas totais", value: overview.value.conversations?.total ?? 0 },
  { label: "Conversas abertas", value: overview.value.conversations?.open ?? 0 },
  { label: "Mensagens 30d", value: overview.value.messages?.last30d ?? 0 },
  { label: "Sucesso IA", value: `${overview.value.ai?.successRate ?? 0}%` },
]);
const columns = [
  { key: "day", label: "Dia" },
  { key: "inbound", label: "Recebidas" },
  { key: "ai", label: "IA" },
  { key: "human", label: "Humanas" },
  { key: "total", label: "Total" },
];
const rows = computed(() => days.value.map(d => ({ ...d, day: formatDate(d.day) })));
async function loadReports() {
  loading.value = true;
  try {
    const [overviewRes, daysRes] = await Promise.all([api.fetch<any>("/analytics/overview"), api.fetch<any>("/analytics/messages-per-day?days=30")]);
    overview.value = overviewRes;
    days.value = daysRes.days || [];
  } finally { loading.value = false; }
}
onMounted(loadReports);
</script>
