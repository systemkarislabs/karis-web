<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Planos</p>
        <h1>O que cada empresa pode usar</h1>
        <p>Defina módulos, modelos de IA e limites de uso. A empresa herda o plano e ainda pode ter exceções no detalhe dela.</p>
      </div>
      <div class="super-admin-actions">
        <button type="button" @click="loadPlans">
          <Icon name="refresh" :size="15" />
          Atualizar
        </button>
      </div>
    </header>

    <div class="super-admin-grid">
      <section class="super-admin-panel">
        <div class="panel-title">
          <div>
            <h2>Planos cadastrados</h2>
            <p>Você decide aqui o que entra em cada pacote comercial.</p>
          </div>
        </div>

        <div class="plan-card-grid">
          <article v-for="plan in plans" :key="plan.id" class="plan-admin-card" :class="{ inactive: !plan.isActive }" @click="edit(plan)">
            <div class="plan-card-head">
              <div>
                <strong>{{ plan.name }}</strong>
                <span>{{ formatMoney(plan.priceCents) }} / {{ intervalLabel(plan.billingInterval) }}</span>
              </div>
              <div class="plan-card-actions" @click.stop>
                <span class="status-pill" :class="{ off: !plan.isActive }">{{ plan.isActive ? "Ativo" : "Inativo" }}</span>
                <button
                  class="plan-card-delete-btn"
                  type="button"
                  title="Excluir plano"
                  :disabled="deletingPlanId === plan.id"
                  @click="confirmDeletePlan(plan)"
                >
                  <Icon name="trash" :size="13" />
                </button>
              </div>
            </div>
            <p>{{ plan.description || "Sem descrição" }}</p>
            <div class="plan-limits">
              <span>Usuários: {{ limit(plan.maxUsers) }}</span>
              <span>WhatsApp: {{ limit(plan.maxWhatsappConnections) }}</span>
              <span>IA/mês: {{ limit(plan.features?.limits?.aiMessages) }}</span>
              <span>Documentos: {{ limit(plan.features?.limits?.knowledgeDocuments) }}</span>
            </div>
            <div class="module-tags">
              <span v-for="module in enabledModules(plan)" :key="module">{{ module }}</span>
            </div>
          </article>
        </div>

        <!-- Modal de confirmação de exclusão de plano -->
        <div v-if="deletePlanTarget" class="sa-confirm-overlay" @click.self="deletePlanTarget = null">
          <div class="sa-confirm-modal">
            <div class="sa-confirm-icon">
              <Icon name="alert" :size="24" color="var(--ka-danger)" />
            </div>
            <h3>Excluir plano?</h3>
            <p>
              Você está prestes a excluir o plano <strong>{{ deletePlanTarget.name }}</strong>.
              Empresas vinculadas a este plano perderão a referência. Esta ação não pode ser desfeita.
            </p>
            <div class="sa-confirm-actions">
              <button class="btn secondary" type="button" @click="deletePlanTarget = null">Cancelar</button>
              <button class="btn danger" type="button" :disabled="deletingPlanId === deletePlanTarget.id" @click="deletePlan">
                {{ deletingPlanId === deletePlanTarget.id ? 'Excluindo...' : 'Sim, excluir' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="super-admin-panel">
        <h2>{{ form.id ? "Editar plano" : "Criar plano" }}</h2>
        <p>Use limites vazios para ilimitado. Módulos desligados ficam bloqueados para empresas desse plano.</p>

        <form class="stack-form" @submit.prevent="savePlan">
          <label>Nome<input v-model="form.name" required /></label>
          <label>Slug<input v-model="form.slug" placeholder="pro, starter..." /></label>
          <label>Descrição<textarea v-model="form.description" rows="3" /></label>
          <div class="split-fields">
            <label>Preço mensal<input v-model.number="priceReais" type="number" min="0" step="1" /></label>
            <label>Trial dias<input v-model.number="form.trialDays" type="number" min="0" /></label>
          </div>
          <div class="split-fields">
            <label>Usuários<input v-model.number="form.maxUsers" type="number" min="0" /></label>
            <label>WhatsApps<input v-model.number="form.maxWhatsappConnections" type="number" min="0" /></label>
          </div>

          <h3>Limites de IA</h3>
          <div class="split-fields">
            <label>Mensagens IA/mês<input v-model.number="form.features.limits.aiMessages" type="number" min="0" /></label>
            <label>Conversas/mês<input v-model.number="form.features.limits.conversations" type="number" min="0" /></label>
          </div>
          <div class="split-fields">
            <label>Contatos<input v-model.number="form.features.limits.contacts" type="number" min="0" /></label>
            <label>Documentos RAG<input v-model.number="form.features.limits.knowledgeDocuments" type="number" min="0" /></label>
          </div>

          <h3>Módulos do plano</h3>
          <div class="module-grid">
            <label v-for="module in modules" :key="module.key">
              <input v-model="form.features.modules[module.key]" type="checkbox" />
              <span class="toggle"></span>
              {{ module.label }}
            </label>
          </div>

          <h3>Modelos liberados</h3>
          <div class="module-grid">
            <label v-for="model in models" :key="model">
              <input :checked="form.features.models.includes(model)" type="checkbox" @change="toggleModel(model)" />
              <span class="toggle"></span>
              {{ model }}
            </label>
          </div>

          <div class="feature-toggles">
            <label><input v-model="form.isActive" type="checkbox" /><span class="toggle"></span> Plano ativo</label>
            <label><input v-model="form.aiEnabled" type="checkbox" /><span class="toggle"></span> IA ativa</label>
            <label><input v-model="form.whatsappEnabled" type="checkbox" /><span class="toggle"></span> WhatsApp</label>
          </div>
          <p v-if="error" class="form-error">{{ error }}</p>
          <button class="primary-action" type="submit" :disabled="saving">{{ saving ? "Salvando..." : "Salvar plano" }}</button>
          <button v-if="form.id" type="button" @click="resetForm">Novo plano</button>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">

definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const api = useAdminApi();
const toast = useToast();
const plans = ref<any[]>([]);
const saving = ref(false);
const error = ref("");
const deletePlanTarget = ref<any | null>(null);
const deletingPlanId = ref<string | null>(null);
const modules = [
  { key: "crm", label: "CRM" },
  { key: "sales", label: "Vendas" },
  { key: "campaigns", label: "Campanhas" },
  { key: "automations", label: "Automações" },
  { key: "calendar", label: "Calendário" },
  { key: "reports", label: "Relatórios" },
  { key: "knowledge", label: "Base de conhecimento" },
  { key: "playground", label: "Playground IA" },
  { key: "billing", label: "Faturamento" },
];
const models = ["gemma4:e4b", "gemma4:e2b", "gpt-4.1-mini", "gpt-4.1", "gemini-1.5-pro"];

function emptyForm() {
  return {
    id: "",
    name: "",
    slug: "",
    description: "",
    isActive: true,
    aiEnabled: true,
    whatsappEnabled: true,
    karisLinkEnabled: false,
    priceCents: 0,
    billingInterval: "monthly",
    trialDays: 7,
    sortOrder: 0,
    maxUsers: 3,
    maxWhatsappConnections: 1,
    features: {
      limits: { aiMessages: 1000, conversations: 500, contacts: 1000, knowledgeDocuments: 20 },
      modules: Object.fromEntries(modules.map(module => [module.key, true])),
      models: ["gemma4:e4b"],
      support: { humanHandoff: true, priority: false, onboarding: false },
    },
  };
}

const form = reactive<any>(emptyForm());
const priceReais = computed({
  get: () => Math.round((form.priceCents || 0) / 100),
  set: value => { form.priceCents = Number(value || 0) * 100; },
});

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((value || 0) / 100);
}

function intervalLabel(value?: string | null) {
  return value === "yearly" ? "ano" : value === "custom" ? "custom" : "mês";
}

function limit(value?: number | null) {
  return value === null || value === undefined || value === 0 ? "ilimitado" : value;
}

function enabledModules(plan: any) {
  return Object.entries(plan.features?.modules || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => modules.find(module => module.key === key)?.label || key)
    .slice(0, 5);
}

function toggleModel(model: string) {
  if (form.features.models.includes(model)) {
    form.features.models = form.features.models.filter((item: string) => item !== model);
  } else {
    form.features.models.push(model);
  }
}

function edit(plan: any) {
  Object.assign(form, emptyForm(), JSON.parse(JSON.stringify(plan)));
  form.features = {
    ...emptyForm().features,
    ...(plan.features || {}),
    limits: { ...emptyForm().features.limits, ...(plan.features?.limits || {}) },
    modules: { ...emptyForm().features.modules, ...(plan.features?.modules || {}) },
    models: plan.features?.models || ["gemma4:e4b"],
  };
}

function resetForm() {
  Object.assign(form, emptyForm());
}

async function loadPlans() {
  const data = await api.fetch<{ plans: any[] }>("/plans?includeInactive=1");
  plans.value = data.plans;
}

async function savePlan() {
  saving.value = true;
  error.value = "";
  try {
    const path = form.id ? `/plans/${form.id}` : "/plans";
    await api.fetch(path, {
      method: form.id ? "PATCH" : "POST",
      body: JSON.stringify({ ...form, id: undefined, slug: form.slug || null, description: form.description || null }),
    });
    resetForm();
    await loadPlans();
  } catch (err: any) {
    error.value = err?.data?.message || "Não foi possível salvar o plano.";
  } finally {
    saving.value = false;
  }
}

function confirmDeletePlan(plan: any) {
  deletePlanTarget.value = plan;
}

async function deletePlan() {
  if (!deletePlanTarget.value) return;
  deletingPlanId.value = deletePlanTarget.value.id;
  try {
    await api.fetch(`/plans/${deletePlanTarget.value.id}`, { method: "DELETE" });
    toast.success(`Plano "${deletePlanTarget.value.name}" excluído.`);
    if (form.id === deletePlanTarget.value.id) resetForm();
    deletePlanTarget.value = null;
    await loadPlans();
  } catch (err: any) {
    toast.error(err?.data?.message || "Não foi possível excluir o plano.");
  } finally {
    deletingPlanId.value = null;
  }
}

onMounted(loadPlans);
</script>
