<template>
  <NuxtLayout name="default">
    <div class="crm-page">
      <!-- Header -->
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
          <Button size="sm" @click="openNewDeal">
            <Plus class="h-4 w-4" />
            Novo lead
          </Button>
        </div>
      </section>

      <!-- Board -->
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
            <button
              v-for="deal in stageDeals(stage.id)"
              :key="deal.id"
              class="crm-deal"
              type="button"
              @click="openDeal(deal)"
            >
              <div class="crm-deal-head">
                <div class="crm-deal-title">
                  <Avatar :name="deal.contact?.name || deal.title" size="sm" />
                  <strong>{{ deal.contact?.name || deal.title }}</strong>
                </div>
                <span v-if="deal.aiScore" class="crm-deal-score">
                  <Sparkles class="h-2.5 w-2.5" />{{ deal.aiScore }}
                </span>
              </div>
              <b v-if="deal.valueCents" class="crm-deal-value">{{ formatMoney(deal.valueCents) }}</b>
              <p v-if="deal.aiNextAction" class="crm-deal-action">
                <Sparkles class="h-3 w-3" style="color:var(--ka-brand);flex-shrink:0;" />
                {{ deal.aiNextAction }}
              </p>
              <div class="crm-deal-footer">
                <span v-for="tag in (deal.contact?.tags || []).slice(0, 2)" :key="tag" class="crm-deal-tag">{{ tag }}</span>
                <span class="crm-deal-time" style="display:flex;align-items:center;gap:4px;">
                  <Clock class="h-3 w-3" />{{ relativeTime(deal.updatedAt) }}
                </span>
                <button class="crm-deal-menu" type="button" @click.stop>
                  <MoreHorizontal class="h-3.5 w-3.5" />
                </button>
              </div>
            </button>

            <div v-if="!stageDeals(stage.id).length" class="crm-empty">Sem negócios nesta etapa.</div>
          </div>

          <button class="crm-add-deal" type="button" @click="openNewDeal(stage.id)">
            <Plus class="h-3.5 w-3.5" /> Adicionar
          </button>
        </article>
      </section>

      <EmptyState v-else :icon="Kanban" title="Pipeline vazio" description="A API respondeu, mas ainda não há etapas de CRM nesta empresa." />
    </div>

    <!-- ── Novo Lead Modal ───────────────────────── -->
    <Modal :open="showNewDeal" title="Novo lead" @close="showNewDeal = false">
      <form class="space-y-4" @submit.prevent="createDeal">
        <div>
          <label class="field-label">Título do lead *</label>
          <input v-model="form.title" class="input" type="text" placeholder="Ex: Proposta para João" required />
        </div>
        <div>
          <label class="field-label">Nome do contato</label>
          <input v-model="form.contactName" class="input" type="text" placeholder="Nome do cliente" />
        </div>
        <div>
          <label class="field-label">Etapa</label>
          <select v-model="form.stageId" class="input">
            <option value="">Selecionar etapa</option>
            <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
          </select>
        </div>
        <div>
          <label class="field-label">Valor (R$)</label>
          <input v-model.number="form.valueReais" class="input" type="number" min="0" step="0.01" placeholder="0,00" />
        </div>
        <p v-if="formError" class="form-alert">{{ formError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" @click="showNewDeal = false">Cancelar</Button>
          <Button type="submit" :disabled="formLoading">
            <LoaderCircle v-if="formLoading" class="h-4 w-4 spin" />
            {{ formLoading ? "Salvando..." : "Criar lead" }}
          </Button>
        </div>
      </form>
    </Modal>

    <!-- ── Deal Detail Panel ─────────────────────── -->
    <Sheet :open="!!selectedDeal" @close="selectedDeal = null">
      <template v-if="selectedDeal">
        <div class="sheet-header">
          <h2 class="sheet-title">{{ selectedDeal.contact?.name || selectedDeal.title }}</h2>
          <Badge :variant="scoreVariant(selectedDeal.aiScore)" size="sm">Score {{ selectedDeal.aiScore ?? 0 }}</Badge>
        </div>

        <div class="sheet-meta">
          <div><span class="label">Valor</span> <span>{{ selectedDeal.valueCents ? formatMoney(selectedDeal.valueCents) : "—" }}</span></div>
          <div><span class="label">Etapa</span> <span>{{ stageName(selectedDeal.stageId) }}</span></div>
          <div><span class="label">Atualizado</span> <span>{{ relativeTime(selectedDeal.updatedAt) }}</span></div>
        </div>

        <p v-if="selectedDeal.aiNextAction" class="sheet-ai-hint">
          <span class="label">Próximo passo IA:</span> {{ selectedDeal.aiNextAction }}
        </p>

        <Tabs :tabs="['Notas', 'Tarefas']" v-model="detailTab">
          <!-- Notes -->
          <template #tab-0>
            <div class="panel-section">
              <form class="panel-add-form" @submit.prevent="addNote">
                <textarea v-model="noteText" class="input" rows="2" placeholder="Adicionar nota..." />
                <Button type="submit" size="sm" :disabled="!noteText.trim() || noteLoading">
                  <LoaderCircle v-if="noteLoading" class="h-3 w-3 spin" />
                  {{ noteLoading ? "..." : "Salvar" }}
                </Button>
              </form>
              <div v-if="notesLoading" class="panel-loading"><Skeleton width="100%" height="4rem" rounded="md" /></div>
              <div v-else-if="notes.length" class="panel-list">
                <div v-for="note in notes" :key="note.id" class="panel-item">
                  <p>{{ note.content }}</p>
                  <span class="panel-item-meta">{{ relativeTime(note.createdAt) }}</span>
                </div>
              </div>
              <p v-else class="panel-empty">Nenhuma nota ainda.</p>
            </div>
          </template>

          <!-- Tasks -->
          <template #tab-1>
            <div class="panel-section">
              <form class="panel-add-form" @submit.prevent="addTask">
                <input v-model="taskTitle" class="input" type="text" placeholder="Descrição da tarefa..." />
                <input v-model="taskDueAt" class="input" type="datetime-local" />
                <Button type="submit" size="sm" :disabled="!taskTitle.trim() || taskLoading">
                  <LoaderCircle v-if="taskLoading" class="h-3 w-3 spin" />
                  {{ taskLoading ? "..." : "Adicionar" }}
                </Button>
              </form>
              <div v-if="tasksLoading" class="panel-loading"><Skeleton width="100%" height="4rem" rounded="md" /></div>
              <div v-else-if="tasks.length" class="panel-list">
                <div v-for="task in tasks" :key="task.id" class="panel-item">
                  <p :class="{ 'line-through opacity-60': task.completedAt }">{{ task.title }}</p>
                  <span class="panel-item-meta">{{ task.dueAt ? relativeTime(task.dueAt) : "Sem prazo" }}</span>
                </div>
              </div>
              <p v-else class="panel-empty">Nenhuma tarefa ainda.</p>
            </div>
          </template>
        </Tabs>
      </template>
    </Sheet>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Clock, Kanban, LoaderCircle, MoreHorizontal, Plus, RefreshCw, Sparkles } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();
const loading = ref(true);
const stages = ref<any[]>([]);
const deals = ref<any[]>([]);

// ── Board ──────────────────────────────────────────
const totalPipelineValue = computed(() =>
  deals.value.reduce((sum, deal) => sum + Number(deal.valueCents || 0), 0)
);

function stageDeals(stageId: string) {
  return deals.value.filter((deal) => deal.stageId === stageId);
}

function stageName(stageId?: string) {
  return stages.value.find((s) => s.id === stageId)?.name || "—";
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
    deals.value = unwrapList(dealsRes, ["deals"]);
  } finally {
    loading.value = false;
  }
}

onMounted(loadCrm);

// ── New Deal Modal ─────────────────────────────────
const showNewDeal = ref(false);
const formLoading = ref(false);
const formError = ref("");
const form = reactive({ title: "", contactName: "", stageId: "", valueReais: null as number | null });

function openNewDeal(stageId?: string) {
  Object.assign(form, { title: "", contactName: "", stageId: stageId || stages.value[0]?.id || "", valueReais: null });
  formError.value = "";
  showNewDeal.value = true;
}

async function createDeal() {
  formError.value = "";
  formLoading.value = true;
  try {
    const body: any = {
      title: form.title,
      stageId: form.stageId || stages.value[0]?.id,
    };
    if (form.contactName) body.contactName = form.contactName;
    if (form.valueReais != null) body.valueCents = Math.round(form.valueReais * 100);

    const newDeal = await api.fetch<any>("/crm/deals", {
      method: "POST",
      body: JSON.stringify(body),
    });
    deals.value.unshift(newDeal.deal || newDeal);
    showNewDeal.value = false;
  } catch (e: any) {
    formError.value = e?.data?.message || "Erro ao criar lead. Tente novamente.";
  } finally {
    formLoading.value = false;
  }
}

// ── Deal Detail Panel ──────────────────────────────
const selectedDeal = ref<any | null>(null);
const detailTab = ref(0);

// Notes
const notes = ref<any[]>([]);
const notesLoading = ref(false);
const noteText = ref("");
const noteLoading = ref(false);

// Tasks
const tasks = ref<any[]>([]);
const tasksLoading = ref(false);
const taskTitle = ref("");
const taskDueAt = ref("");
const taskLoading = ref(false);

async function openDeal(deal: any) {
  selectedDeal.value = deal;
  detailTab.value = 0;
  noteText.value = "";
  taskTitle.value = "";
  taskDueAt.value = "";
  await Promise.all([loadNotes(deal.id), loadTasks(deal.id)]);
}

async function loadNotes(dealId: string) {
  notesLoading.value = true;
  try {
    const res = await api.fetch<any>(`/crm/deals/${dealId}/notes`);
    notes.value = unwrapList(res, ["notes"]);
  } catch {
    notes.value = [];
  } finally {
    notesLoading.value = false;
  }
}

async function loadTasks(dealId: string) {
  tasksLoading.value = true;
  try {
    const res = await api.fetch<any>(`/crm/deals/${dealId}/tasks`);
    tasks.value = unwrapList(res, ["tasks"]);
  } catch {
    tasks.value = [];
  } finally {
    tasksLoading.value = false;
  }
}

async function addNote() {
  if (!selectedDeal.value || !noteText.value.trim()) return;
  noteLoading.value = true;
  try {
    const note = await api.fetch<any>(`/crm/deals/${selectedDeal.value.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ content: noteText.value.trim() }),
    });
    notes.value.unshift(note.note || note);
    noteText.value = "";
  } catch {
    // silent — note might not be implemented yet
  } finally {
    noteLoading.value = false;
  }
}

async function addTask() {
  if (!selectedDeal.value || !taskTitle.value.trim()) return;
  taskLoading.value = true;
  try {
    const body: any = { title: taskTitle.value.trim() };
    if (taskDueAt.value) body.dueAt = new Date(taskDueAt.value).toISOString();
    const task = await api.fetch<any>(`/crm/deals/${selectedDeal.value.id}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    tasks.value.unshift(task.task || task);
    taskTitle.value = "";
    taskDueAt.value = "";
  } catch {
    // silent — task might not be implemented yet
  } finally {
    taskLoading.value = false;
  }
}
</script>

<style scoped>
.sheet-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.sheet-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ka-fg);
  flex: 1;
}
.sheet-meta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--ka-fg);
  margin-bottom: 1rem;
}
.sheet-meta .label,
.sheet-ai-hint .label {
  color: var(--ka-fg-muted);
  font-size: 0.75rem;
  margin-right: 0.375rem;
}
.sheet-ai-hint {
  font-size: 0.875rem;
  background: var(--ka-gray-50);
  border-radius: var(--ka-r-md);
  padding: 0.625rem 0.75rem;
  margin-bottom: 1rem;
  color: var(--ka-fg);
}
.panel-section {
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.panel-add-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.panel-item {
  padding: 0.625rem 0.75rem;
  background: var(--ka-gray-50);
  border-radius: var(--ka-r-md);
}
.panel-item p {
  font-size: 0.875rem;
  color: var(--ka-fg);
  margin: 0 0 0.25rem;
}
.panel-item-meta {
  font-size: 0.75rem;
  color: var(--ka-fg-muted);
}
.panel-empty,
.panel-loading {
  font-size: 0.875rem;
  color: var(--ka-fg-muted);
  text-align: center;
  padding: 1rem 0;
}
</style>
