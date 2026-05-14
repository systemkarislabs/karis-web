<template>
  <NuxtLayout name="default">
    <div class="crm-page">
      <section class="crm-header">
        <div>
          <p>CRM</p>
          <h1>Pipeline</h1>
          <span>{{ deals.length }} leads ativos · {{ formatMoney(totalPipelineValue) }} em negociação</span>
        </div>
        <div class="crm-actions">
          <Button variant="secondary" size="sm" @click="loadCrm">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm">
            <Plus class="h-4 w-4" />
            Novo lead
          </Button>
        </div>
      </section>

      <section v-if="loading" class="crm-board">
        <Skeleton v-for="i in 4" :key="i" width="18rem" height="32rem" rounded="md" />
      </section>

      <section v-else-if="stages.length" class="crm-board">
        <article v-for="stage in stages" :key="stage.id" class="crm-column">
          <header>
            <span class="crm-dot" :style="{ background: stage.color || 'var(--ka-brand)' }" />
            <strong>{{ stage.name }}</strong>
            <em>{{ stageDeals(stage.id).length }}</em>
          </header>

          <div class="crm-deals">
            <button v-for="deal in stageDeals(stage.id)" :key="deal.id" class="crm-deal" type="button">
              <div class="crm-deal-title">
                <Avatar :name="deal.contact?.name || deal.title" size="sm" />
                <strong>{{ deal.contact?.name || deal.title }}</strong>
              </div>
              <b>{{ deal.valueCents ? formatMoney(deal.valueCents) : "Sem valor" }}</b>
              <p>{{ deal.aiNextAction || deal.conversation?.messages?.[0]?.content || "Sem próximo passo registrado" }}</p>
              <div>
                <Badge :variant="scoreVariant(deal.aiScore)" size="sm">+ {{ deal.aiScore ?? 0 }}</Badge>
                <span>{{ deal.tasks?.[0]?.dueAt ? relativeTime(deal.tasks[0].dueAt) : relativeTime(deal.updatedAt) }}</span>
              </div>
            </button>

            <div v-if="!stageDeals(stage.id).length" class="crm-empty">Sem negócios nesta etapa.</div>
          </div>
        </article>
      </section>

      <EmptyState v-else :icon="Kanban" title="Pipeline vazio" description="A API respondeu, mas ainda não há etapas de CRM nesta empresa." />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Kanban, Plus, RefreshCw } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const stages = ref<any[]>([]);
const deals = ref<any[]>([]);

const totalPipelineValue = computed(() => deals.value.reduce((sum, deal) => sum + Number(deal.valueCents || 0), 0));

function stageDeals(stageId: string) {
  return deals.value.filter((deal) => deal.stageId === stageId);
}

function scoreVariant(score?: number | null) {
  const value = Number(score || 0);
  if (value >= 70) return "success";
  if (value >= 40) return "warning";
  return "neutral";
}

async function loadCrm() {
  loading.value = true;
  try {
    const [stagesRes, dealsRes] = await Promise.all([
      api.fetch<any>("/crm/stages"),
      api.fetch<any>("/crm/deals?limit=200"),
    ]);
    stages.value = stagesRes.stages || [];
    deals.value = unwrapList(dealsRes);
  } finally {
    loading.value = false;
  }
}

onMounted(loadCrm);
</script>
