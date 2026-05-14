<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="Campanhas" description="Envios reais para listas e etapas do CRM.">
        <template #actions>
          <Button variant="secondary" size="sm" @click="loadCampaigns"><RefreshCw class="h-4 w-4" />Atualizar</Button>
        </template>
      </PageHeader>
      <Table :columns="columns" :rows="rows" :loading="loading" empty-title="Nenhuma campanha cadastrada">
        <template #cell-status="{ row }">
          <Badge :variant="statusVariant(row.raw.status)" size="sm" dot>{{ row.status }}</Badge>
        </template>
      </Table>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
definePageMeta({ layout: false, middleware: "auth" });
const api = useApi();
const loading = ref(true);
const campaigns = ref<any[]>([]);
const columns = [
  { key: "name", label: "Campanha", sortable: true },
  { key: "status", label: "Status" },
  { key: "recipients", label: "DestinatÃ¡rios" },
  { key: "createdAt", label: "Criada em" },
];
const rows = computed(() => campaigns.value.map(c => ({ name: c.name, status: statusLabel(c.status), recipients: c._count?.recipients ?? 0, createdAt: formatDate(c.createdAt), raw: c })));
function statusVariant(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "destructive";
  if (status === "RUNNING" || status === "SCHEDULED") return "default";
  return "neutral";
}
async function loadCampaigns() {
  loading.value = true;
  try { campaigns.value = unwrapList(await api.fetch<any>("/campaigns?limit=100")); } finally { loading.value = false; }
}
onMounted(loadCampaigns);
</script>
