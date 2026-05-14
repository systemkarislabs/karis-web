<template>
  <NuxtLayout name="default">
    <section class="ka-page space-y-6">
      <PageHeader
        eyebrow="Administracao"
        title="Admin"
        description="Dados globais aparecem somente quando a sessao tiver acesso admin compativel com a API."
      />

      <div v-if="loading" class="space-y-4">
        <Skeleton class="h-28" />
        <Skeleton class="h-80" />
      </div>

      <EmptyState
        v-else-if="error"
        :icon="ShieldAlert"
        title="Acesso admin indisponivel"
        :description="error"
      />

      <Card v-else padding="none" class="overflow-hidden">
        <Table :columns="columns" :rows="rows" empty-title="Nenhuma empresa encontrada" empty-description="A API retornou acesso valido, mas sem empresas para listar." />
      </Card>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ShieldAlert } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const error = ref("");
const companies = ref<any[]>([]);

const columns = [
  { key: "name", label: "Empresa" },
  { key: "plan", label: "Plano" },
  { key: "users", label: "Usuarios" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Criada em" },
];

const rows = computed(() =>
  companies.value.map((company) => ({
    name: company.name,
    plan: company.subscription?.plan?.name || "Sem plano",
    users: company._count?.users ?? company.users?.length ?? 0,
    status: company.subscription?.status ? statusLabel(company.subscription.status) : "Sem assinatura",
    createdAt: company.createdAt ? formatDate(company.createdAt) : "--",
  })),
);

onMounted(async () => {
  try {
    const data = await api.fetch<any>("/admin/companies");
    companies.value = unwrapList(data, ["companies"]);
  } catch (err: any) {
    error.value = err?.data?.message || "A sessao atual nao possui token admin para consultar `/api/admin/companies`.";
  } finally {
    loading.value = false;
  }
});
</script>
