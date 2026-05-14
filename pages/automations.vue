<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="AutomaÃ§Ãµes" description="Regras e fluxos criados para operar em segundo plano.">
        <template #actions>
          <Button variant="secondary" size="sm" @click="loadAutomations"><RefreshCw class="h-4 w-4" />Atualizar</Button>
        </template>
      </PageHeader>
      <Table :columns="columns" :rows="rows" :loading="loading" empty-title="Nenhuma automaÃ§Ã£o criada">
        <template #cell-status="{ row }"><Badge variant="neutral" size="sm" dot>{{ row.status }}</Badge></template>
      </Table>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
definePageMeta({ layout: false, middleware: "auth" });
const api = useApi();
const loading = ref(true);
const automations = ref<any[]>([]);
const columns = [
  { key: "name", label: "AutomaÃ§Ã£o", sortable: true },
  { key: "triggerType", label: "Gatilho" },
  { key: "status", label: "Status" },
  { key: "updatedAt", label: "Atualizada em" },
];
const rows = computed(() => automations.value.map(a => ({ name: a.name, triggerType: a.triggerType, status: statusLabel(a.status), updatedAt: formatDateTime(a.updatedAt) })));
async function loadAutomations() {
  loading.value = true;
  try { automations.value = unwrapList(await api.fetch<any>("/automations?limit=100")); } finally { loading.value = false; }
}
onMounted(loadAutomations);
</script>
