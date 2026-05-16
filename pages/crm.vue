<template>
  <NuxtLayout name="default">
    <div>
      <!-- Header -->
      <div class="page-header" style="padding: 24px 28px 16px;">
        <div>
          <h1>Pipeline</h1>
          <div class="sub">{{ deals.length }} leads ativos · {{ formatMoney(totalPipelineValue) }} em negociação</div>
        </div>
        <div style="display:flex;gap:8px;">
          <Button variant="secondary" size="sm" @click="loadCrm">
            <RefreshCw class="h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm" @click="openNewDeal">
            <Plus class="h-4 w-4" />
            Novo lead
          </Button>
        </div>
      </div>

      <!-- Board -->
      <div v-if="loading" style="display:flex;gap:14px;padding:0 28px 28px;">
        <Skeleton v-for="i in 4" :key="i" width="280px" height="32rem" rounded="md" />
      </div>

      <div v-else-if="stages.length" class="crm-board" style="padding:0 28px 28px;">
        <div v-for="stage in stages" :key="stage.id" class="crm-col">
          <div class="crm-col-header">
            <div class="title">
              <span class="dot" :style="{ background: stage.color || 'var(--ka-brand)' }" />
              {{ stage.name }}
            </div>
            <span class="count">{{ stageDeals(stage.id).length }}</span>
          </div>

          <button
            v-for="deal in stageDeals(stage.id)"
            :key="deal.id"
            class="lead-card"
            type="button"
            @click="openDeal(deal)"
          >
            <div class="top">
              <Avatar :name="deal.contact?.name || deal.title" size="sm" />
              <span class="name">{{ deal.contact?.name || deal.title }}</span>
              <span v-if="deal.aiScore" class="ai-score">
                <Sparkles class="h-2.5 w-2.5" />{{ deal.aiScore }}
              </span>
            </div>

            <div v-if="deal.valueCents" class="value">
              <span class="currency">R$</span>{{ (deal.valueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) }}
            </div>

            <div v-if="deal.aiNextAction" class="next-action">
              <Sparkles class="h-3 w-3 ico" />
              {{ deal.aiNextAction }}
            </div>

            <div class="footer">
              <div style="display:flex;gap:4px;flex-wrap:wrap;">
                <span v-for="tag in (deal.contact?.tags || []).slice(0, 2)" :key="tag" class="badge neutral" style="height:18px;font-size:10px;padding:0 7px;">{{ tag }}</span>
              </div>
              <span style="display:flex;align-items:center;gap:4px;">
                <Clock class="h-3 w-3" />{{ relativeTime(deal.updatedAt) }}
              </span>
            </div>
          </button>

          <div v-if="!stageDeals(stage.id).length" class="crm-empty" style="border:1px dashed var(--ka-border);border-radius:10px;color:var(--ka-fg-muted);font-size:13px;padding:20px;text-align:center;">
            Sem negócios nesta etapa.
          </div>

          <button class="crm-add-btn" type="button" @click="openNewDeal(stage.id)">
            <Plus class="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
      </div>

      <EmptyState v-else :icon="Kanban" title="Pipeline vazio" description="A API respondeu, mas ainda não há etapas de CRM nesta empresa." style="padding:4rem 28px;" />
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

    <!-- ── Deal Detail Drawer ─────────────────────── -->
    <template v-if="selectedDeal">
      <div class="drawer-backdrop" @click="selectedDeal = null" />
      <aside class="drawer">
        <div class="head">
          <div style="display:flex;align-items:center;gap:12px;">
            <Avatar :name="selectedDeal.contact?.name || selectedDeal.title" size="md" />
            <div>
              <div style="font-weight:600;font-size:16px;color:var(--ka-fg);">{{ selectedDeal.contact?.name || selectedDeal.title }}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                <span class="dot" :style="{ background: stageName(selectedDeal.stageId) ? 'var(--ka-brand)' : 'var(--ka-fg-muted)' }" />
                <span style="font-size:12px;color:var(--ka-fg-2);">{{ stageName(selectedDeal.stageId) }}</span>
              </div>
            </div>
          </div>
          <button class="icon-btn" style="border:0;background:transparent;" @click="selectedDeal = null">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="body">
          <!-- Valor + Score -->
          <div style="display:flex;gap:12px;margin-bottom:16px;">
            <div style="flex:1;padding:12px 14px;background:var(--ka-gray-50);border-radius:10px;">
              <div style="font-size:11px;color:var(--ka-fg-muted);">Valor</div>
              <div style="font-family:var(--ka-font-display);font-weight:700;font-size:20px;margin-top:4px;letter-spacing:-0.01em;">
                {{ selectedDeal.valueCents ? formatMoney(selectedDeal.valueCents) : "—" }}
              </div>
            </div>
            <div style="flex:1;padding:12px 14px;background:var(--ka-bot-bg);border-radius:10px;">
              <div style="font-size:11px;color:var(--ka-bot);font-weight:600;">Score da IA</div>
              <div style="font-family:var(--ka-font-display);font-weight:700;font-size:20px;margin-top:4px;color:var(--ka-bot);letter-spacing:-0.01em;">
                {{ selectedDeal.aiScore ?? 0 }}/100
              </div>
            </div>
          </div>

          <!-- Próxima ação -->
          <div v-if="selectedDeal.aiNextAction" class="field-block">
            <h5>Próxima ação</h5>
            <div style="padding:12px;background:var(--ka-brand-50);border-radius:10px;display:flex;align-items:center;gap:10px;">
              <Sparkles class="h-4 w-4" style="color:var(--ka-brand);flex-shrink:0;" />
              <span style="font-size:14px;color:var(--ka-fg);font-weight:500;flex:1;">{{ selectedDeal.aiNextAction }}</span>
            </div>
          </div>

          <!-- Notas -->
          <div class="field-block">
            <h5>Notas</h5>
            <form @submit.prevent="addNote" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
              <textarea v-model="noteText" class="input" rows="2" placeholder="Adicionar nota..." style="min-height:unset;padding:10px;" />
              <Button type="submit" size="sm" :disabled="!noteText.trim() || noteLoading">
                <LoaderCircle v-if="noteLoading" class="h-3 w-3 spin" />
                {{ noteLoading ? "..." : "Salvar nota" }}
              </Button>
            </form>
            <div v-if="notesLoading"><Skeleton height="4rem" /></div>
            <div v-else-if="notes.length" style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="note in notes" :key="note.id" style="padding:10px 12px;background:var(--ka-gray-50);border-radius:8px;">
                <p style="font-size:13px;color:var(--ka-fg);margin:0 0 4px;">{{ note.content }}</p>
                <span style="font-size:11px;color:var(--ka-fg-muted);">{{ relativeTime(note.createdAt) }}</span>
              </div>
            </div>
            <p v-else style="font-size:13px;color:var(--ka-fg-muted);">Nenhuma nota ainda.</p>
          </div>

          <!-- Tarefas -->
          <div class="field-block">
            <h5>Tarefas</h5>
            <form @submit.prevent="addTask" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
              <input v-model="taskTitle" class="input" type="text" placeholder="Descrição da tarefa..." style="height:38px;" />
              <input v-model="taskDueAt" class="input" type="datetime-local" style="height:38px;" />
              <Button type="submit" size="sm" :disabled="!taskTitle.trim() || taskLoading">
                <LoaderCircle v-if="taskLoading" class="h-3 w-3 spin" />
                {{ taskLoading ? "..." : "Adicionar tarefa" }}
              </Button>
            </form>
            <div v-if="tasksLoading"><Skeleton height="4rem" /></div>
            <div v-else-if="tasks.length" style="display:flex;flex-direction:column;gap:8px;">
              <div v-for="task in tasks" :key="task.id" style="padding:10px 12px;background:var(--ka-gray-50);border-radius:8px;">
                <p :class="{ 'line-through opacity-60': task.completedAt }" style="font-size:13px;color:var(--ka-fg);margin:0 0 4px;">{{ task.title }}</p>
                <span style="font-size:11px;color:var(--ka-fg-muted);">{{ task.dueAt ? relativeTime(task.dueAt) : "Sem prazo" }}</span>
              </div>
            </div>
            <p v-else style="font-size:13px;color:var(--ka-fg-muted);">Nenhuma tarefa ainda.</p>
          </div>
        </div>

        <div class="foot">
          <button class="btn ghost sm" @click="selectedDeal = null">Fechar</button>
        </div>
      </aside>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Clock, Kanban, LoaderCircle, Plus, RefreshCw, Sparkles, X } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

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

// ── Deal Detail ──────────────────────────────────
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
