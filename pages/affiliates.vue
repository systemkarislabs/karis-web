<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="Afiliados" description="Parceiros reais, links e comissÃµes cadastradas.">
        <template #actions><Button variant="secondary" size="sm" @click="loadAffiliates"><RefreshCw class="h-4 w-4" />Atualizar</Button></template>
      </PageHeader>
      <Table :columns="columns" :rows="rows" :loading="loading" empty-title="Nenhum afiliado cadastrado">
        <template #cell-status="{ row }"><Badge :variant="row.raw.status === 'ACTIVE' ? 'success' : 'neutral'" size="sm" dot>{{ row.status }}</Badge></template>
      </Table>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { RefreshCw } from "lucide-vue-next";
definePageMeta({ layout: false, middleware: "auth" });
const api = useApi();
const loading = ref(true);
const affiliates = ref<any[]>([]);
const columns = [
  { key: "name", label: "Afiliado" },
  { key: "email", label: "E-mail" },
  { key: "commission", label: "ComissÃ£o" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Criado em" },
];
const rows = computed(() => affiliates.value.map(a => ({ name: a.name, email: a.email, commission: `${Number(a.commissionRate || 0) / 100}%`, status: statusLabel(a.status), createdAt: formatDate(a.createdAt), raw: a })));
async function loadAffiliates() {
  loading.value = true;
  try { affiliates.value = unwrapList(await api.fetch<any>("/affiliates?limit=100")); } finally { loading.value = false; }
}
onMounted(loadAffiliates);
</script>
