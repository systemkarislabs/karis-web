<template>
  <div class="agent-page">
    <section class="agent-hero">
      <div class="agent-hero-info">
        <div class="agent-hero-icon">
          <Icon name="sparkles" :size="24" />
        </div>
        <div>
          <p class="agent-hero-label">Agente IA</p>
          <h1 class="agent-hero-title">{{ form.name || "Agente IA da Karis" }}</h1>
          <small class="agent-hero-status">
            <span class="agent-status-dot" :class="form.isActive ? 'agent-status-online' : 'agent-status-offline'" />
            {{ form.isActive ? "Ativa" : "Inativa" }}
            <template v-if="agentStats.today > 0"> · {{ agentStats.today }} conversas hoje · {{ agentStats.successRate }}% sem necessidade humana</template>
          </small>
        </div>
      </div>
      <div class="agent-hero-actions">
        <Button variant="secondary" size="sm" @click="runPlayground">
          <Icon name="play" :size="16" />
          Testar
        </Button>
        <Button size="sm" :loading="saving" @click="saveAssistant">
          <Icon name="sparkles" :size="16" />
          Publicar mudanças
        </Button>
      </div>
    </section>

    <nav class="agent-tabs">
      <button v-for="tab in tabs" :key="tab.key" class="agent-tab" :class="{ 'agent-tab-active': activeTab === tab.key }" type="button" @click="activeTab = tab.key">
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'config'" class="agent-config">
      <div class="agent-main">
        <article class="agent-card">
          <div class="agent-card-header">
            <h2 class="agent-card-title">Identidade</h2>
            <p class="agent-card-desc">Nome e instruções que definem como o agente se apresenta.</p>
          </div>
          <div class="form-group">
            <label class="form-label">Nome do agente</label>
            <input v-model="form.name" class="form-input" placeholder="Assistente Karis" />
          </div>
          <div class="form-group">
            <label class="form-label">Instruções</label>
            <textarea v-model="form.instructions" class="form-textarea" placeholder="Você é um atendente da empresa X. Responda apenas sobre produtos e serviços da empresa..." />
          </div>
        </article>
      </div>

      <aside class="agent-aside">
        <article class="agent-card">
          <h3 class="agent-card-title">Modelo</h3>
          <div class="form-group">
            <select v-model="form.model" class="form-input">
              <option v-for="opt in modelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </article>

        <article class="agent-card">
          <h3 class="agent-card-title">Personalidade</h3>
          <div class="form-group">
            <label class="form-label">Tom de voz</label>
            <select v-model="form.personality" class="form-input">
              <option v-for="opt in personalityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Idioma principal</label>
            <select v-model="form.language" class="form-input">
              <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </article>

        <article class="agent-card">
          <h3 class="agent-card-title">Auto-resposta</h3>
          <label class="agent-toggle">
            <span>Responder automaticamente</span>
            <input v-model="form.isActive" type="checkbox" />
          </label>
          <label class="agent-toggle">
            <span>Sugerir para o humano</span>
            <input v-model="form.suggestToHuman" type="checkbox" />
          </label>
        </article>
      </aside>
    </section>

    <section v-else-if="activeTab === 'sectors'" class="agent-card">
      <div class="agent-card-header agent-card-header-row">
        <div>
          <h2 class="agent-card-title">Setores de Transferência</h2>
          <p class="agent-card-desc">A IA detecta automaticamente quando transferir e envia um resumo da conversa para o responsável.</p>
        </div>
        <Button size="sm" @click="openSectorForm()">
          <Icon name="plus" :size="16" />
          Novo setor
        </Button>
      </div>

      <div v-if="sectorFormVisible" class="agent-sector-form">
        <div class="agent-sector-form-grid">
          <div class="form-group">
            <label class="form-label">Nome do setor</label>
            <input v-model="sectorForm.name" class="form-input" placeholder="Suporte Técnico" />
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp do setor</label>
            <input v-model="sectorForm.phone" class="form-input" placeholder="5541999999999" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Quando transferir</label>
          <textarea v-model="sectorForm.transferWhen" class="form-textarea" placeholder="Quando o cliente tiver problema técnico, defeito no produto, precisar de instalação..." />
        </div>
        <div class="form-group">
          <label class="form-label">Descrição do setor (opcional)</label>
          <textarea v-model="sectorForm.description" class="form-textarea" placeholder="Equipe de suporte técnico especializado" />
        </div>
        <div class="agent-sector-form-actions">
          <Button size="sm" :loading="sectorSaving" @click="saveSector">Salvar setor</Button>
          <Button size="sm" variant="secondary" @click="closeSectorForm">Cancelar</Button>
        </div>
      </div>

      <div v-if="sectorsLoading" class="agent-sector-skeletons">
        <Skeleton v-for="i in 3" :key="i" height="64px" rounded="md" />
      </div>
      <div v-else-if="sectors.length" class="agent-sector-list">
        <div v-for="sector in sectors" :key="sector.id" class="agent-sector-item">
          <div class="agent-sector-info">
            <div class="agent-sector-header">
              <Icon name="arrowRight" :size="16" style="color: var(--ka-brand);" />
              <strong>{{ sector.name }}</strong>
              <Badge :variant="sector.isActive ? 'success' : 'secondary'" size="sm">
                {{ sector.isActive ? 'Ativo' : 'Inativo' }}
              </Badge>
            </div>
            <span class="agent-sector-phone">{{ formatPhone(sector.phone) }}</span>
            <p v-if="sector.transferWhen" class="agent-sector-when">
              <em>Quando:</em> {{ sector.transferWhen }}
            </p>
          </div>
          <div class="agent-sector-actions">
            <button class="agent-sector-action-btn" title="Editar" @click="openSectorForm(sector)">
              <Icon name="edit" :size="16" />
            </button>
            <button class="agent-sector-action-btn agent-sector-action-danger" title="Excluir" @click="deleteSector(sector.id)">
              <Icon name="trash" :size="16" />
            </button>
          </div>
        </div>
      </div>
      <EmptyState
        v-else-if="!sectorFormVisible"
        icon="arrowRight"
        title="Nenhum setor configurado"
        description="Adicione setores para que a IA transfira automaticamente quando necessário."
      />
    </section>

    <section v-else-if="activeTab === 'knowledge'" class="agent-card">
      <div class="agent-card-header agent-card-header-row">
        <div>
          <h2 class="agent-card-title">Base de conhecimento</h2>
          <p class="agent-card-desc">Documentos e textos que a IA consulta para responder.</p>
        </div>
        <Button size="sm" @click="createKnowledge">
          <Icon name="upload" :size="16" />
          Adicionar texto
        </Button>
      </div>

      <div class="agent-knowledge-form">
        <div class="form-group">
          <label class="form-label">Título</label>
          <input v-model="knowledgeForm.title" class="form-input" placeholder="FAQ de preços" />
        </div>
        <div class="form-group">
          <label class="form-label">Conteúdo rápido</label>
          <input v-model="knowledgeForm.content" class="form-input" placeholder="Cole uma regra ou resposta frequente" />
        </div>
      </div>

      <div v-if="loading" class="agent-knowledge-skeletons">
        <Skeleton v-for="i in 4" :key="i" height="48px" rounded="md" />
      </div>
      <div v-else-if="knowledge.length" class="agent-knowledge-list">
        <div v-for="item in knowledge" :key="item.id" class="agent-knowledge-item">
          <Icon name="fileText" :size="20" style="color: var(--ka-brand);" />
          <div class="agent-knowledge-info">
            <strong>{{ item.title }}</strong>
            <small>{{ item.fileName || `${String(item.content || '').length} caracteres` }} · {{ formatDate(item.createdAt) }}</small>
          </div>
          <Badge variant="success" size="sm">Indexado</Badge>
        </div>
      </div>
      <EmptyState v-else icon="fileText" title="Nenhum conhecimento adicionado" description="Adicione textos ou documentos para a IA responder com mais precisão." />
    </section>

    <section v-else class="agent-card">
      <div class="agent-card-header">
        <h2 class="agent-card-title">Playground</h2>
        <p class="agent-card-desc">Ambiente de teste. Não envia mensagens para clientes reais.</p>
      </div>
      <div class="agent-playground">
        <textarea v-model="playgroundMessage" class="agent-playground-input" placeholder="Digite uma pergunta para testar o agente." />
        <div class="agent-playground-response">
          <p class="agent-playground-response-label">Resposta</p>
          <Skeleton v-if="playgroundLoading" height="96px" rounded="md" />
          <span v-else class="agent-playground-response-text">{{ playgroundReply || "A resposta do teste aparece aqui." }}</span>
        </div>
      </div>
      <Button class="agent-playground-btn" :loading="playgroundLoading" @click="runPlayground">Testar agente</Button>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const api = useApi();
const toast = useToast();
const activeTab = ref("config");
const loading = ref(true);
const saving = ref(false);
const playgroundLoading = ref(false);
const assistant = ref<any>(null);
const knowledge = ref<any[]>([]);
const sectors = ref<any[]>([]);
const sectorsLoading = ref(false);
const sectorSaving = ref(false);
const sectorFormVisible = ref(false);
const editingSectorId = ref<string | null>(null);

const form = reactive({ name: "Assistente Karis", instructions: "", isActive: true, suggestToHuman: false, personality: "", language: "pt-BR", model: "karis-pro", transferPhone: "", transferConditions: "" });
const agentStats = reactive({ today: 0, successRate: 0 });
const knowledgeForm = reactive({ title: "", content: "" });
const sectorForm = reactive({ name: "", phone: "", description: "", transferWhen: "" });
const playgroundMessage = ref("Como vocês podem me ajudar no atendimento?");
const playgroundReply = ref("");

const tabs = [
  { key: "config",    label: "Configuração" },
  { key: "sectors",   label: "Transferências" },
  { key: "knowledge", label: "Conhecimento" },
  { key: "playground",label: "Playground" },
];

const modelOptions = [
  { value: "karis-pro",   label: "Karis Pro (recomendado)" },
  { value: "karis-fast",  label: "Karis Fast — rápido · preciso" },
];

const languageOptions = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en",    label: "English" },
  { value: "es",    label: "Español" },
];

const personalityOptions = [
  { value: "",            label: "Padrão (cordial e profissional)" },
  { value: "descontraido",label: "Descontraído (usa emojis, tom próximo)" },
  { value: "prestativo",  label: "Prestativo (detalhado, proativo)" },
  { value: "formal",      label: "Formal (senhor/senhora, tom sério)" },
  { value: "direto",      label: "Direto (respostas curtas e precisas)" },
];

watch(activeTab, (value) => {
  if (value === "sectors" && !sectors.value.length) loadSectors();
});

function formatPhone(phone: string) {
  const p = String(phone || "").replace(/\D/g, "");
  if (p.length === 13) return `+${p.slice(0,2)} (${p.slice(2,4)}) ${p.slice(4,9)}-${p.slice(9)}`;
  if (p.length === 12) return `+${p.slice(0,2)} (${p.slice(2,4)}) ${p.slice(4,8)}-${p.slice(8)}`;
  return phone;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

async function loadAgent() {
  loading.value = true;
  try {
    const [assistantRes, knowledgeRes, overviewRes] = await Promise.all([
      api.fetch<any>("/assistant"),
      api.fetch<any>("/knowledge").catch(() => ({ knowledge: [] })),
      api.fetch<any>("/analytics/overview").catch(() => null),
    ]);
    assistant.value = assistantRes.assistant;
    Object.assign(form, {
      name: assistant.value?.name || "Assistente Karis",
      instructions: assistant.value?.instructions || "",
      isActive: assistant.value?.isActive ?? true,
      suggestToHuman: assistant.value?.suggestToHuman ?? false,
      personality: assistant.value?.personality || "",
      language: assistant.value?.language || "pt-BR",
      model: assistant.value?.model || "karis-pro",
      transferPhone: assistant.value?.transferPhone || "",
      transferConditions: assistant.value?.transferConditions || "",
    });
    knowledge.value = knowledgeRes.knowledge || assistant.value?.knowledge || [];
    if (overviewRes) {
      agentStats.today = overviewRes?.conversations?.today ?? 0;
      agentStats.successRate = overviewRes?.ai?.successRate ?? 0;
    }
  } finally {
    loading.value = false;
  }
}

async function loadSectors() {
  sectorsLoading.value = true;
  try {
    sectors.value = await api.fetch<any[]>("/assistant/transfer-sectors");
  } catch {
    sectors.value = [];
  } finally {
    sectorsLoading.value = false;
  }
}

function openSectorForm(sector?: any) {
  if (sector) {
    editingSectorId.value = sector.id;
    Object.assign(sectorForm, {
      name: sector.name,
      phone: sector.phone,
      description: sector.description || "",
      transferWhen: sector.transferWhen || "",
    });
  } else {
    editingSectorId.value = null;
    Object.assign(sectorForm, { name: "", phone: "", description: "", transferWhen: "" });
  }
  sectorFormVisible.value = true;
}

function closeSectorForm() {
  sectorFormVisible.value = false;
  editingSectorId.value = null;
}

async function saveSector() {
  if (!sectorForm.name.trim() || !sectorForm.phone.trim()) {
    toast.warning("Informe o nome e o WhatsApp do setor.");
    return;
  }
  sectorSaving.value = true;
  try {
    if (editingSectorId.value) {
      const updated = await api.fetch<any>(`/assistant/transfer-sectors/${editingSectorId.value}`, {
        method: "PUT",
        body: JSON.stringify(sectorForm),
      });
      const idx = sectors.value.findIndex(s => s.id === editingSectorId.value);
      if (idx !== -1) sectors.value[idx] = updated;
    } else {
      const created = await api.fetch<any>("/assistant/transfer-sectors", {
        method: "POST",
        body: JSON.stringify(sectorForm),
      });
      sectors.value = [...sectors.value, created];
    }
    toast.success("Setor salvo.");
    closeSectorForm();
  } catch (err: any) {
    toast.error(err?.data?.error || "Erro ao salvar setor.");
  } finally {
    sectorSaving.value = false;
  }
}

async function deleteSector(id: string) {
  if (!confirm("Excluir este setor de transferência?")) return;
  try {
    await api.fetch(`/assistant/transfer-sectors/${id}`, { method: "DELETE" });
    sectors.value = sectors.value.filter(s => s.id !== id);
    toast.success("Setor excluído.");
  } catch {
    toast.error("Erro ao excluir setor.");
  }
}

async function saveAssistant() {
  saving.value = true;
  try {
    const res = await api.fetch<any>("/assistant", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    assistant.value = res.assistant;
    Object.assign(form, {
      name: assistant.value?.name || "Assistente Karis",
      instructions: assistant.value?.instructions || "",
      isActive: assistant.value?.isActive ?? true,
      suggestToHuman: assistant.value?.suggestToHuman ?? false,
      personality: assistant.value?.personality || "",
      language: assistant.value?.language || "pt-BR",
      model: assistant.value?.model || "karis-pro",
      transferPhone: assistant.value?.transferPhone || "",
      transferConditions: assistant.value?.transferConditions || "",
    });
    toast.success("Agente atualizado.");
  } catch (err: any) {
    toast.error(err?.data?.message || err?.message || "Não foi possível publicar as mudanças.");
  } finally {
    saving.value = false;
  }
}

async function createKnowledge() {
  if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
    toast.warning("Informe título e conteúdo.");
    return;
  }
  const res = await api.fetch<any>("/knowledge", {
    method: "POST",
    body: JSON.stringify({ title: knowledgeForm.title, content: knowledgeForm.content }),
  });
  knowledge.value = [res.knowledge, ...knowledge.value];
  knowledgeForm.title = "";
  knowledgeForm.content = "";
  toast.success("Conhecimento adicionado.");
}

async function runPlayground() {
  if (!playgroundMessage.value.trim()) {
    toast.warning("Digite uma mensagem para testar.");
    return;
  }
  playgroundLoading.value = true;
  playgroundReply.value = "";
  activeTab.value = "playground";
  try {
    const res = await api.fetch<any>("/assistant/playground", {
      method: "POST",
      body: JSON.stringify({ message: playgroundMessage.value }),
    });
    playgroundReply.value = res.reply || "Sem resposta do modelo.";
  } catch (err: any) {
    toast.error(err?.data?.message || "Não foi possível testar o agente. Verifique se o modelo está disponível.");
  } finally {
    playgroundLoading.value = false;
  }
}

onMounted(loadAgent);
</script>


