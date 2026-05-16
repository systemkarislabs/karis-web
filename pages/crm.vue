<template>
  <div class="crm-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pipeline</h1>
        <p class="page-subtitle">{{ deals.length }} leads ativos · {{ formatMoney(totalPipelineValue) }} em negociação</p>
      </div>
      <div class="page-actions">
        <Button variant="secondary" size="sm" @click="loadCrm">
          <Icon name="refresh" :size="16" />
          Atualizar
        </Button>
        <Button size="sm" @click="openNewDeal">
          <Icon name="plus" :size="16" />
          Novo lead
        </Button>
      </div>
    </div>

    <div v-if="loading" class="crm-board">
      <div v-for="i in 4" :key="i" class="crm-col-skeleton">
        <Skeleton height="32px" rounded="md" />
        <div class="crm-col-cards">
          <Skeleton v-for="j in 3" :key="j" height="120px" rounded="md" />
        </div>
      </div>
    </div>

    <div v-else-if="stages.length" class="crm-board">
      <div v-for="stage in stages" :key="stage.id" class="crm-col">
        <div class="crm-col-header">
          <div class="crm-col-title">
            <span class="crm-col-dot" :style="{ background: stage.color || 'var(--ka-brand)' }" />
            {{ stage.name }}
          </div>
          <span class="crm-col-count">{{ stageDeals(stage.id).length }}</span>
        </div>

        <div class="crm-col-cards">
          <button
            v-for="deal in stageDeals(stage.id)"
            :key="deal.id"
            class="crm-deal-card"
            type="button"
            @click="openDeal(deal)"
          >
            <div class="crm-deal-top">
              <Avatar :name="deal.contact?.name || deal.title" size="sm" />
              <span class="crm-deal-name">{{ deal.contact?.name || deal.title }}</span>
              <span v-if="deal.aiScore" class="crm-deal-score">
                <Icon name="sparkles" :size="12" />{{ deal.aiScore }}
              </span>
            </div>

            <div v-if="deal.valueCents" class="crm-deal-value">
              <span class="crm-deal-currency">R$</span>{{ (deal.valueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) }}
            </div>

            <div v-if="deal.aiNextAction" class="crm-deal-action">
              <Icon name="sparkles" :size="12" class="crm-deal-action-icon" />
              {{ deal.aiNextAction }}
            </div>

            <div class="crm-deal-footer">
              <div class="crm-deal-tags">
                <span v-for="tag in (deal.contact?.tags || []).slice(0, 2)" :key="tag" class="crm-deal-tag">{{ tag }}</span>
              </div>
              <span class="crm-deal-time">
                <Icon name="clock" :size="12" />{{ relativeTime(deal.updatedAt) }}
              </span>
            </div>
          </button>
        </div>

        <div v-if="!stageDeals(stage.id).length" class="crm-col-empty">
          Sem negócios nesta etapa.
        </div>

        <button class="crm-add-btn" type="button" @click="openNewDeal(stage.id)">
          <Icon name="plus" :size="14" /> Adicionar
        </button>
      </div>
    </div>

    <EmptyState v-else icon="kanban" title="Pipeline vazio" description="A API respondeu, mas ainda não há etapas de CRM nesta empresa." />

    <Modal :open="showNewDeal" title="Novo lead" @close="showNewDeal = false">
      <form class="modal-form" @submit.prevent="createDeal">
        <div class="form-group">
          <label class="form-label">Título do lead *</label>
          <input v-model="form.title" class="form-input" type="text" placeholder="Ex: Proposta para João" required />
        </div>
        <div class="form-group">
          <label class="form-label">Nome do contato</label>
          <input v-model="form.contactName" class="form-input" type="text" placeholder="Nome do cliente" />
        </div>
        <div class="form-group">
          <label class="form-label">Etapa</label>
          <select v-model="form.stageId" class="form-input">
            <option value="">Selecionar etapa</option>
            <option v-for="stage in stages" :key="stage.id" :value="stage.id">{{ stage.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Valor (R$)</label>
          <input v-model.number="form.valueReais" class="form-input" type="number" min="0" step="0.01" placeholder="0,00" />
        </div>
        <p v-if="formError" class="form-alert">{{ formError }}</p>
        <div class="modal-actions">
          <Button variant="secondary" type="button" @click="showNewDeal = false">Cancelar</Button>
          <Button type="submit" :disabled="formLoading">
            {{ formLoading ? "Salvando..." : "Criar lead" }}
          </Button>
        </div>
      </form>
    </Modal>

    <template v-if="selectedDeal">
      <div class="drawer-backdrop" @click="selectedDeal = null" />
      <aside class="drawer">
        <div class="drawer-header">
          <div class="drawer-header-info">
            <Avatar :name="selectedDeal.contact?.name || selectedDeal.title" size="md" />
            <div>
              <div class="drawer-deal-name">{{ selectedDeal.contact?.name || selectedDeal.title }}</div>
              <div class="drawer-deal-stage">
                <span class="crm-col-dot" :style="{ background: stageName(selectedDeal.stageId) ? 'var(--ka-brand)' : 'var(--ka-fg-3)' }" />
                {{ stageName(selectedDeal.stageId) }}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" @click="selectedDeal = null">
            <Icon name="x" :size="18" />
          </Button>
        </div>

        <div class="drawer-body">
          <div class="drawer-stats">
            <div class="drawer-stat">
              <div class="drawer-stat-label">Valor</div>
              <div class="drawer-stat-value">{{ selectedDeal.valueCents ? formatMoney(selectedDeal.valueCents) : "—" }}</div>
            </div>
            <div class="drawer-stat drawer-stat-ai">
              <div class="drawer-stat-label">Score da IA</div>
              <div class="drawer-stat-value drawer-stat-ai-value">{{ selectedDeal.aiScore ?? 0 }}/100</div>
            </div>
          </div>

          <div v-if="selectedDeal.aiNextAction" class="drawer-section">
            <h5 class="drawer-section-title">Próxima ação</h5>
            <div class="drawer-ai-action">
              <Icon name="sparkles" :size="16" />
              <span>{{ selectedDeal.aiNextAction }}</span>
            </div>
          </div>

          <div class="drawer-section">
            <h5 class="drawer-section-title">Notas</h5>
            <form class="drawer-note-form" @submit.prevent="addNote">
              <textarea v-model="noteText" class="form-input" rows="2" placeholder="Adicionar nota..." />
              <Button type="submit" size="sm" :disabled="!noteText.trim() || noteLoading">
                {{ noteLoading ? "..." : "Salvar nota" }}
              </Button>
            </form>
            <div v-if="notesLoading"><Skeleton height="64px" rounded="md" /></div>
            <div v-else-if="notes.length" class="drawer-notes">
              <div v-for="note in notes" :key="note.id" class="drawer-note">
                <p>{{ note.content }}</p>
                <span>{{ relativeTime(note.createdAt) }}</span>
              </div>
            </div>
            <p v-else class="drawer-empty">Nenhuma nota ainda.</p>
          </div>

          <div class="drawer-section">
            <h5 class="drawer-section-title">Tarefas</h5>
            <form class="drawer-task-form" @submit.prevent="addTask">
              <input v-model="taskTitle" class="form-input" type="text" placeholder="Descrição da tarefa..." />
              <input v-model="taskDueAt" class="form-input" type="datetime-local" />
              <Button type="submit" size="sm" :disabled="!taskTitle.trim() || taskLoading">
                {{ taskLoading ? "..." : "Adicionar tarefa" }}
              </Button>
            </form>
            <div v-if="tasksLoading"><Skeleton height="64px" rounded="md" /></div>
            <div v-else-if="tasks.length" class="drawer-tasks">
              <div v-for="task in tasks" :key="task.id" class="drawer-task">
                <p :class="{ 'drawer-task-done': task.completedAt }">{{ task.title }}</p>
                <span>{{ task.dueAt ? relativeTime(task.dueAt) : "Sem prazo" }}</span>
              </div>
            </div>
            <p v-else class="drawer-empty">Nenhuma tarefa ainda.</p>
          </div>
        </div>

        <div class="drawer-footer">
          <Button variant="secondary" size="sm" @click="selectedDeal = null">Fechar</Button>
        </div>
      </aside>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const api = useApi();
const loading = ref(true);
const stages = ref<any[]>([]);
const deals = ref<any[]>([]);

const totalPipelineValue = computed(() =>
  deals.value.reduce((sum, deal) => sum + Number(deal.valueCents || 0), 0)
);

function stageDeals(stageId: string) {
  return deals.value.filter((deal) => deal.stageId === stageId);
}

function stageName(stageId?: string) {
  return stages.value.find((s) => s.id === stageId)?.name || "—";
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
    const body: any = { title: form.title, stageId: form.stageId || stages.value[0]?.id };
    if (form.contactName) body.contactName = form.contactName;
    if (form.valueReais != null) body.valueCents = Math.round(form.valueReais * 100);
    const newDeal = await api.fetch<any>("/crm/deals", { method: "POST", body: JSON.stringify(body) });
    deals.value.unshift(newDeal.deal || newDeal);
    showNewDeal.value = false;
  } catch (e: any) {
    formError.value = e?.data?.message || "Erro ao criar lead. Tente novamente.";
  } finally {
    formLoading.value = false;
  }
}

const selectedDeal = ref<any | null>(null);
const notes = ref<any[]>([]);
const notesLoading = ref(false);
const noteText = ref("");
const noteLoading = ref(false);
const tasks = ref<any[]>([]);
const tasksLoading = ref(false);
const taskTitle = ref("");
const taskDueAt = ref("");
const taskLoading = ref(false);

async function openDeal(deal: any) {
  selectedDeal.value = deal;
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
  } catch { notes.value = []; }
  finally { notesLoading.value = false; }
}

async function loadTasks(dealId: string) {
  tasksLoading.value = true;
  try {
    const res = await api.fetch<any>(`/crm/deals/${dealId}/tasks`);
    tasks.value = unwrapList(res, ["tasks"]);
  } catch { tasks.value = []; }
  finally { tasksLoading.value = false; }
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
  } catch {} finally { noteLoading.value = false; }
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
  } catch {} finally { taskLoading.value = false; }
}
</script>

