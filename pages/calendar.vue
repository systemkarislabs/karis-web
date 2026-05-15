<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <PageHeader title="Calendário" description="Compromissos vinculados a contatos e negócios do CRM.">
        <template #actions>
          <Button variant="secondary" size="sm" @click="loadAppointments">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 class="text-lg font-semibold">Próximos horários</h2>
          <div v-if="loading" class="mt-4 space-y-2">
            <Skeleton v-for="i in 5" :key="i" height="3rem" />
          </div>
          <div v-else-if="appointments.length" class="mt-4 divide-y divide-[--ka-divider]">
            <div v-for="item in appointments" :key="item.id" class="py-3">
              <p class="font-semibold">{{ item.title }}</p>
              <p class="text-sm text-[--ka-fg-2]">
                {{ formatDateTime(item.startAt) }} até {{ formatDateTime(item.endAt) }}
              </p>
              <p class="text-xs text-[--ka-fg-muted]">
                {{ item.contact?.name || item.contact?.phone || "Sem contato vinculado" }}
              </p>
            </div>
          </div>
          <EmptyState v-else :icon="CalendarDays" title="Nenhum compromisso" description="Agendamentos futuros aparecerão aqui." />
        </Card>

        <Table
          :columns="columns"
          :rows="rows"
          :loading="loading"
          empty-title="Sem agenda no período"
        />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { CalendarDays, RefreshCw } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const appointments = ref<any[]>([]);

const columns = [
  { key: "title",   label: "Título" },
  { key: "contact", label: "Contato" },
  { key: "start",   label: "Início" },
  { key: "status",  label: "Status" },
];

const rows = computed(() =>
  appointments.value.map((a) => ({
    title:   a.title,
    contact: a.contact?.name || a.contact?.phone || "--",
    start:   formatDateTime(a.startAt),
    status:  statusLabel(a.status),
  }))
);

async function loadAppointments() {
  loading.value = true;
  try {
    appointments.value = (await api.fetch<any>("/calendar/appointments")).appointments || [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadAppointments);
</script>
