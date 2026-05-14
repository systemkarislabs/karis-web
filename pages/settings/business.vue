<template>
  <NuxtLayout name="default">
    <section class="ka-page space-y-6">
      <PageHeader
        eyebrow="Configuracoes"
        title="Empresa"
        description="Dados operacionais e recursos ativos nesta conta."
      >
        <template #actions>
          <NuxtLink to="/settings" class="btn-ghost inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold">
            <ChevronLeft class="h-4 w-4" />
            Voltar
          </NuxtLink>
        </template>
      </PageHeader>

      <div v-if="loading" class="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Skeleton class="h-80" />
        <Skeleton class="h-80" />
      </div>

      <EmptyState
        v-else-if="error"
        :icon="AlertCircle"
        title="Empresa indisponivel"
        :description="error"
        action-label="Tentar novamente"
        @action="load"
      />

      <div v-else class="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card padding="lg">
          <form class="space-y-5" @submit.prevent="save">
            <Input v-model="form.name" label="Nome da empresa" required />
            <div class="grid gap-3 sm:grid-cols-3">
              <label v-for="toggle in toggles" :key="toggle.key" class="rounded-[--ka-radius] border border-[--ka-border] p-4">
                <span class="flex items-start justify-between gap-3">
                  <span>
                    <span class="block text-sm font-semibold text-[--ka-fg]">{{ toggle.label }}</span>
                    <span class="mt-1 block text-xs leading-5 text-[--ka-fg-muted]">{{ toggle.description }}</span>
                  </span>
                  <input v-model="form[toggle.key]" type="checkbox" class="mt-1 h-4 w-4 accent-[--ka-primary]" />
                </span>
              </label>
            </div>
            <div class="flex justify-end">
              <Button type="submit" :loading="saving">Salvar alteracoes</Button>
            </div>
          </form>
        </Card>

        <Card padding="lg" class="space-y-5">
          <div>
            <p class="text-sm font-semibold text-[--ka-fg]">Plano e uso</p>
            <p class="text-sm text-[--ka-fg-muted]">Contadores vindos de `/companies/me`.</p>
          </div>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-[--ka-fg-muted]">Plano</dt>
              <dd class="font-medium text-[--ka-fg]">{{ company?.subscription?.plan?.name || "Sem plano ativo" }}</dd>
            </div>
            <div v-for="metric in metrics" :key="metric.label" class="flex justify-between gap-4">
              <dt class="text-[--ka-fg-muted]">{{ metric.label }}</dt>
              <dd class="font-mono text-[--ka-fg]">{{ metric.value }}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { AlertCircle, ChevronLeft } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

type CompanyResponse = {
  company: {
    id: string;
    name: string;
    aiEnabled?: boolean;
    whatsappEnabled?: boolean;
    karisLinkEnabled?: boolean;
    subscription?: { plan?: { name?: string } | null } | null;
    _count?: { users?: number; contacts?: number; conversations?: number };
  };
};

const api = useApi();
const toast = useToast();
const company = ref<CompanyResponse["company"] | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const form = reactive({ name: "", aiEnabled: false, whatsappEnabled: false, karisLinkEnabled: false });

const toggles = [
  { key: "aiEnabled" as const, label: "IA", description: "Assistente e playground ativos." },
  { key: "whatsappEnabled" as const, label: "WhatsApp", description: "Permite conectar o canal." },
  { key: "karisLinkEnabled" as const, label: "Karis Link", description: "Habilita paginas de agenda." },
];

const metrics = computed(() => [
  { label: "Usuarios", value: company.value?._count?.users ?? 0 },
  { label: "Contatos", value: company.value?._count?.contacts ?? 0 },
  { label: "Conversas", value: company.value?._count?.conversations ?? 0 },
]);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const data = await api.fetch<CompanyResponse>("/companies/me");
    company.value = data.company;
    form.name = data.company.name || "";
    form.aiEnabled = !!data.company.aiEnabled;
    form.whatsappEnabled = !!data.company.whatsappEnabled;
    form.karisLinkEnabled = !!data.company.karisLinkEnabled;
  } catch (err: any) {
    error.value = err?.data?.message || "Nao foi possivel carregar os dados da empresa.";
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const data = await api.fetch<{ company: CompanyResponse["company"] }>("/companies/me", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    company.value = { ...company.value, ...data.company } as CompanyResponse["company"];
    toast.success("Empresa atualizada com sucesso.");
  } catch (err: any) {
    toast.error(err?.data?.message || "Nao foi possivel salvar a empresa.");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
