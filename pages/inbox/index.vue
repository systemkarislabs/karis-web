<template>
  <div class="inbox-shell">
    <aside class="inbox-filters">
      <div class="inbox-filters-header">
        <h2 class="inbox-filters-title">Filtros</h2>
        <Button variant="ghost" size="icon" @click="showFilters = !showFilters">
          <Icon name="filter" :size="16" />
        </Button>
      </div>
      <div class="inbox-filter-group">
        <p class="inbox-filter-label">Caixa</p>
        <button v-for="filter in filters" :key="filter.key" class="inbox-filter-btn" :class="{ 'inbox-filter-btn-active': activeFilter === filter.key }" type="button" @click="activeFilter = filter.key">
          <span>{{ filter.label }}</span>
          <span class="inbox-filter-count">{{ filter.count }}</span>
        </button>
      </div>
      <div class="inbox-filter-group">
        <p class="inbox-filter-label">Status</p>
        <button v-for="status in statusFilters" :key="status.key" class="inbox-filter-btn" :class="{ 'inbox-filter-btn-active': activeFilter === status.key }" type="button" @click="activeFilter = status.key">
          <span>{{ status.label }}</span>
          <span class="inbox-filter-count">{{ status.count }}</span>
        </button>
      </div>
    </aside>

    <section class="inbox-list">
      <div class="inbox-list-header">
        <div>
          <h2>Conversas</h2>
          <p>{{ filteredConversations.length }} de {{ conversations.length }} atendimentos</p>
        </div>
        <Button variant="ghost" size="icon" @click="loadConversations">
          <Icon name="refresh" :size="16" />
        </Button>
      </div>
      <div class="inbox-search-wrap">
        <Icon name="search" :size="16" class="inbox-search-icon" />
        <input v-model="search" class="inbox-search-input" placeholder="Buscar contato ou mensagem" />
      </div>

      <div class="inbox-list-scroll">
        <div v-if="loadingConversations" class="inbox-list-skeletons">
          <Skeleton v-for="i in 8" :key="i" height="76px" />
        </div>
        <button
          v-for="conv in filteredConversations"
          v-else
          :key="conv.id"
          class="inbox-thread"
          :class="{ 'inbox-thread-active': selectedId === conv.id }"
          type="button"
          @click="selectConversation(conv.id)"
        >
          <Avatar :name="conv.contact?.name || conv.contact?.phone" size="sm" />
          <div class="inbox-thread-body">
            <div class="inbox-thread-top">
              <strong>{{ conv.contact?.name || conv.contact?.phone || "Contato" }}</strong>
              <time>{{ relativeTime(conv.updatedAt) }}</time>
            </div>
            <p class="inbox-thread-preview">{{ conv.lastMessage?.content || "Sem mensagens ainda" }}</p>
            <div class="inbox-thread-bottom">
              <span class="inbox-status-badge" :class="`is-${(conv.status || 'open').toLowerCase()}`">{{ statusLabel(conv.status) }}</span>
              <span v-if="conv.unreadCount" class="inbox-unread-badge">{{ conv.unreadCount }}</span>
            </div>
          </div>
        </button>
        <EmptyState v-if="!loadingConversations && !filteredConversations.length" icon="message" title="Sem conversas" description="Nenhum atendimento encontrado para este filtro." />
      </div>
    </section>

    <section class="inbox-chat">
      <template v-if="selectedConversation">
        <header class="inbox-chat-header">
          <Avatar :name="selectedContact?.name || selectedContact?.phone" size="md" />
          <div class="inbox-chat-header-info">
            <h3>{{ selectedContact?.name || selectedContact?.phone || "Contato" }}</h3>
            <p>{{ selectedContact?.phone || "Telefone não informado" }} · {{ statusLabel(selectedConversation.status) }}</p>
          </div>
          <div class="inbox-chat-actions">
            <Button
              v-if="selectedConversation.status === 'OPEN'"
              variant="success"
              size="sm"
              :loading="resolving"
              @click="resolveConversation"
            >
              <Icon name="check" :size="16" />
              Resolver
            </Button>
            <Button v-else variant="secondary" size="sm" @click="reopenConversation">
              <Icon name="refresh" :size="16" />
              Reabrir
            </Button>
            <Button variant="ghost" size="icon" @click="showContactPanel = !showContactPanel">
              <Icon name="user" :size="18" />
            </Button>
          </div>
        </header>

        <div class="inbox-messages">
          <div v-if="loadingMessages" class="inbox-messages-skeletons">
            <Skeleton v-for="i in 7" :key="i" height="52px" />
          </div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="inbox-msg"
              :class="msg.direction === 'INBOUND' ? 'inbox-msg-inbound' : msg.senderType === 'AI' ? 'inbox-msg-ai' : 'inbox-msg-outbound'"
            >
              <p v-if="msg.senderType === 'AI'" class="inbox-msg-agent">
                <Icon name="sparkles" :size="14" />
                IA Karis
              </p>
              <p>{{ msg.content }}</p>
              <time>{{ formatDateTime(msg.createdAt) }}</time>
            </div>

            <article v-if="lastAiMessage && !dismissedSuggestion" class="inbox-ai-suggestion">
              <p><Icon name="sparkles" :size="16" /> Sugestão da IA</p>
              <strong>{{ lastAiMessage.content }}</strong>
              <div class="inbox-ai-actions">
                <Button size="sm" @click="draft = lastAiMessage.content; sendMessage()">Aceitar e enviar</Button>
                <Button variant="secondary" size="sm" @click="draft = lastAiMessage.content">Editar antes</Button>
                <Button variant="ghost" size="sm" @click="dismissedSuggestion = true">Descartar</Button>
              </div>
            </article>

            <EmptyState v-if="!messages.length" icon="message" title="Conversa sem mensagens" description="As mensagens deste atendimento aparecerão aqui." />
          </template>
        </div>

        <form class="inbox-composer" @submit.prevent="sendMessage">
          <div class="inbox-composer-tools">
            <Button type="button" variant="ghost" size="icon">
              <Icon name="paperclip" :size="18" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Icon name="smile" :size="18" />
            </Button>
            <Button type="button" variant="ghost" size="icon">
              <Icon name="mic" :size="18" />
            </Button>
          </div>
          <textarea v-model="draft" class="inbox-composer-input" rows="1" placeholder="Digite uma mensagem para o cliente" />
          <Button type="submit" size="icon" :loading="sending" :disabled="!draft.trim() || sending">
            <Icon name="send" :size="18" />
          </Button>
        </form>
      </template>

      <EmptyState v-else class="inbox-empty" icon="message" title="Selecione uma conversa" description="Escolha um atendimento para ver mensagens e dados do contato." />
    </section>

    <aside v-if="selectedConversation && showContactPanel" class="inbox-contact-panel">
      <div class="inbox-contact-panel-header">
        <h3>Contato</h3>
        <Button variant="ghost" size="icon" @click="showContactPanel = false">
          <Icon name="x" :size="16" />
        </Button>
      </div>

      <div class="inbox-contact-profile">
        <Avatar :name="selectedContact?.name || selectedContact?.phone" size="lg" />
        <h4>{{ selectedContact?.name || "Contato" }}</h4>
        <p>{{ selectedContact?.phone || "Sem telefone" }}</p>
      </div>

      <div class="inbox-contact-actions">
        <Button variant="secondary" size="sm">
          <Icon name="phone" :size="16" />
          Ligar
        </Button>
        <Button variant="secondary" size="sm">
          <Icon name="mail" :size="16" />
          Email
        </Button>
      </div>

      <dl class="inbox-contact-details">
        <div>
          <dt>Email</dt>
          <dd>{{ selectedContact?.email || "Não informado" }}</dd>
        </div>
        <div v-if="selectedContact?.city || selectedContact?.state">
          <dt>Cidade</dt>
          <dd>{{ [selectedContact?.city, selectedContact?.state].filter(Boolean).join(", ") }}</dd>
        </div>
        <div>
          <dt>1º contato</dt>
          <dd>{{ selectedContact?.createdAt ? relativeTime(selectedContact.createdAt) : "Não informado" }}</dd>
        </div>
        <div>
          <dt>Última compra</dt>
          <dd>{{ selectedContact?.lastPurchaseAt ? formatDate(selectedContact.lastPurchaseAt) : "Sem registro" }}</dd>
        </div>
        <div>
          <dt>Origem</dt>
          <dd>{{ selectedConversation.channel || "WhatsApp" }}</dd>
        </div>
      </dl>

      <div class="inbox-contact-tags">
        <span v-for="tag in selectedTags" :key="tag" class="inbox-tag">{{ tag }}</span>
        <span v-if="!selectedTags.length" class="inbox-no-tags">Sem tags</span>
      </div>

      <div class="inbox-contact-deal-section">
        <p class="inbox-contact-section-label">Deal em andamento</p>
        <Skeleton v-if="dealLoading" height="56px" rounded="md" />
        <div v-else-if="contactDeal" class="inbox-contact-deal" @click="navigateTo('/crm')">
          <div class="inbox-contact-deal-top">
            <strong>{{ contactDeal.contact?.name || contactDeal.title }}</strong>
            <span v-if="contactDeal.aiScore" class="inbox-deal-score">{{ contactDeal.aiScore }}</span>
          </div>
          <div class="inbox-contact-deal-meta">
            <span class="inbox-deal-stage">{{ contactDeal.stage?.name || "—" }}</span>
            <span v-if="contactDeal.valueCents" class="inbox-deal-value">{{ formatMoney(contactDeal.valueCents) }}</span>
          </div>
        </div>
        <p v-else class="inbox-no-deal">Nenhum deal ativo</p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: "auth" });

const route = useRoute();
const api = useApi();
const toast = useToast();
const search = ref("");
const activeFilter = ref("all");
const conversations = ref<any[]>([]);
const selectedId = ref<string | null>(typeof route.query.conversation === "string" ? route.query.conversation : null);
const selectedConversation = ref<any | null>(null);
const messages = ref<any[]>([]);
const draft = ref("");
const loadingConversations = ref(true);
const loadingMessages = ref(false);
const sending = ref(false);
const dismissedSuggestion = ref(false);
const showContactPanel = ref(true);
const showFilters = ref(true);

const filters = computed(() => [
  { key: "all", label: "Todas", count: conversations.value.length },
  { key: "open", label: "Abertas", count: conversations.value.filter(c => c.status === "OPEN").length },
  { key: "unread", label: "Não lidas", count: unreadTotal.value },
  { key: "human", label: "Com humano", count: conversations.value.filter(c => c.aiEnabled === false).length },
]);

const statusFilters = computed(() => [
  { key: "closed", label: "Fechadas", count: conversations.value.filter(c => c.status === "CLOSED").length },
  { key: "snoozed", label: "Adiada", count: conversations.value.filter(c => c.status === "SNOOZED").length },
]);

const unreadTotal = computed(() => conversations.value.reduce((sum, conv) => sum + Number(conv.unreadCount || 0), 0));
const selectedContact = computed(() => selectedConversation.value?.contact || conversations.value.find(c => c.id === selectedId.value)?.contact || null);
const selectedTags = computed(() => {
  const raw = selectedContact.value?.tags || selectedConversation.value?.tags || [];
  return Array.isArray(raw) ? raw.filter(Boolean).slice(0, 6) : [];
});
const lastAiMessage = computed(() => [...messages.value].reverse().find(msg => msg.senderType === "AI"));

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase();
  return conversations.value.filter(conv => {
    if (activeFilter.value === "open" && conv.status !== "OPEN") return false;
    if (activeFilter.value === "closed" && conv.status !== "CLOSED") return false;
    if (activeFilter.value === "snoozed" && conv.status !== "SNOOZED") return false;
    if (activeFilter.value === "unread" && !conv.unreadCount) return false;
    if (activeFilter.value === "human" && conv.aiEnabled !== false) return false;
    if (!q) return true;
    return `${conv.contact?.name || ""} ${conv.contact?.phone || ""} ${conv.lastMessage?.content || ""}`.toLowerCase().includes(q);
  });
});

async function loadConversations() {
  loadingConversations.value = true;
  try {
    const res = await api.fetch<any>("/conversations?limit=100");
    conversations.value = unwrapList(res, ["conversations"]);
    if (!selectedId.value && conversations.value[0]) selectedId.value = conversations.value[0].id;
    if (selectedId.value) await selectConversation(selectedId.value);
  } finally {
    loadingConversations.value = false;
  }
}

async function selectConversation(id: string) {
  selectedId.value = id;
  dismissedSuggestion.value = false;
  contactDeal.value = null;
  loadingMessages.value = true;
  try {
    const [convRes, msgRes] = await Promise.all([
      api.fetch<any>(`/conversations/${id}`),
      api.fetch<any>(`/messages/conversation/${id}`),
    ]);
    selectedConversation.value = convRes.conversation;
    messages.value = unwrapList(msgRes, ["messages"]);
    const cid = convRes.conversation?.contactId || convRes.conversation?.contact?.id;
    if (cid) loadContactDeal(cid);
  } finally {
    loadingMessages.value = false;
  }
}

async function loadContactDeal(contactId: string) {
  dealLoading.value = true;
  try {
    const res = await api.fetch<any>(`/crm/deals?contactId=${contactId}&limit=1`);
    const list = unwrapList(res, ["deals"]);
    contactDeal.value = list[0] || null;
  } catch {
    contactDeal.value = null;
  } finally {
    dealLoading.value = false;
  }
}

const contactDeal = ref<any | null>(null);
const dealLoading = ref(false);
const resolving = ref(false);

async function resolveConversation() {
  if (!selectedId.value || resolving.value) return;
  resolving.value = true;
  try {
    await api.fetch(`/conversations/${selectedId.value}`, {
      method: "PUT",
      body: JSON.stringify({ status: "CLOSED" }),
    });
    await loadConversations();
    selectedId.value = null;
    toast.success("Conversa resolvida.");
  } catch {
    toast.error("Não foi possível resolver a conversa.");
  } finally {
    resolving.value = false;
  }
}

async function reopenConversation() {
  if (!selectedId.value) return;
  try {
    await api.fetch(`/conversations/${selectedId.value}`, {
      method: "PUT",
      body: JSON.stringify({ status: "OPEN" }),
    });
    await loadConversations();
    toast.success("Conversa reaberta.");
  } catch {
    toast.error("Não foi possível reabrir a conversa.");
  }
}

async function sendMessage() {
  if (!selectedId.value || !draft.value.trim()) return;
  const content = draft.value.trim();
  sending.value = true;
  try {
    await api.fetch(`/messages/conversation/${selectedId.value}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    draft.value = "";
    await selectConversation(selectedId.value);
  } finally {
    sending.value = false;
  }
}

onMounted(loadConversations);
</script>

<style scoped>
.inbox-shell {
  display: grid;
  grid-template-columns: 200px 320px 1fr 300px;
  height: calc(100vh - var(--ka-topbar-height, 64px));
  overflow: hidden;
}

@media (max-width: 1200px) {
  .inbox-shell {
    grid-template-columns: 200px 280px 1fr;
  }
  .inbox-contact-panel {
    display: none;
  }
}

@media (max-width: 900px) {
  .inbox-shell {
    grid-template-columns: 1fr;
  }
  .inbox-filters,
  .inbox-list {
    display: none;
  }
}

.inbox-filters {
  border-right: 1px solid var(--ka-border);
  background: var(--ka-surface);
  padding: 16px 12px;
  overflow-y: auto;
}

.inbox-filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.inbox-filters-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 0;
}

.inbox-filter-group {
  margin-bottom: 20px;
}

.inbox-filter-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ka-fg-3);
  margin: 0 0 8px;
  padding: 0 8px;
}

.inbox-filter-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--ka-r-sm);
  background: transparent;
  font-size: 13px;
  color: var(--ka-fg-2);
  cursor: pointer;
  text-align: left;
}

.inbox-filter-btn:hover {
  background: var(--ka-gray-50);
  color: var(--ka-fg);
}

.inbox-filter-btn-active {
  background: var(--ka-brand-alpha);
  color: var(--ka-brand-dark);
  font-weight: 600;
}

.inbox-filter-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--ka-fg-3);
}

.inbox-list {
  border-right: 1px solid var(--ka-border);
  background: var(--ka-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inbox-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--ka-border);
}

.inbox-list-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
}

.inbox-list-header p {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin: 2px 0 0;
}

.inbox-search-wrap {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ka-border);
}

.inbox-search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ka-fg-3);
  pointer-events: none;
}

.inbox-search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 36px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-gray-50);
  font-size: 13px;
  color: var(--ka-fg);
  outline: none;
}

.inbox-search-input:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 2px var(--ka-brand-alpha);
}

.inbox-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.inbox-list-skeletons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.inbox-thread {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: var(--ka-r-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}

.inbox-thread:hover {
  background: var(--ka-gray-50);
}

.inbox-thread-active {
  background: var(--ka-brand-alpha);
}

.inbox-thread-body {
  flex: 1;
  min-width: 0;
}

.inbox-thread-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.inbox-thread-top strong {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inbox-thread-top time {
  font-size: 11px;
  color: var(--ka-fg-3);
  flex-shrink: 0;
}

.inbox-thread-preview {
  font-size: 12px;
  color: var(--ka-fg-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 0 6px;
}

.inbox-thread-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
}

.inbox-status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.inbox-status-badge.is-open {
  background: var(--ka-brand-alpha);
  color: var(--ka-brand-dark);
}

.inbox-status-badge.is-closed {
  background: var(--ka-gray-100);
  color: var(--ka-fg-3);
}

.inbox-status-badge.is-snoozed {
  background: var(--ka-warning-alpha);
  color: var(--ka-warning);
}

.inbox-unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--ka-danger);
  color: white;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.inbox-chat {
  display: flex;
  flex-direction: column;
  background: var(--ka-bg);
  overflow: hidden;
}

.inbox-chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--ka-border);
  background: var(--ka-surface);
}

.inbox-chat-header-info {
  flex: 1;
  min-width: 0;
}

.inbox-chat-header-info h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inbox-chat-header-info p {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin: 2px 0 0;
}

.inbox-chat-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.inbox-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inbox-messages-skeletons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inbox-msg {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: var(--ka-r-md);
  font-size: 14px;
  line-height: 1.5;
}

.inbox-msg p {
  margin: 0 0 4px;
}

.inbox-msg time {
  font-size: 11px;
  opacity: 0.6;
}

.inbox-msg-inbound {
  align-self: flex-start;
  background: var(--ka-surface);
  border: 1px solid var(--ka-border);
  color: var(--ka-fg);
}

.inbox-msg-outbound {
  align-self: flex-end;
  background: var(--ka-brand);
  color: white;
}

.inbox-msg-ai {
  align-self: flex-start;
  background: var(--ka-brand-alpha);
  border: 1px solid var(--ka-brand);
  color: var(--ka-brand-dark);
}

.inbox-msg-agent {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  margin: 0 0 4px;
}

.inbox-ai-suggestion {
  padding: 16px;
  border: 1px solid var(--ka-brand);
  border-radius: var(--ka-r-md);
  background: var(--ka-brand-alpha);
  margin-top: 8px;
}

.inbox-ai-suggestion p {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-brand-dark);
  margin: 0 0 8px;
}

.inbox-ai-suggestion strong {
  display: block;
  font-size: 14px;
  color: var(--ka-fg);
  margin-bottom: 12px;
}

.inbox-ai-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.inbox-composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--ka-border);
  background: var(--ka-surface);
}

.inbox-composer-tools {
  display: flex;
  gap: 2px;
}

.inbox-composer-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 10px 14px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-gray-50);
  font-size: 14px;
  color: var(--ka-fg);
  outline: none;
  resize: none;
}

.inbox-composer-input:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 2px var(--ka-brand-alpha);
}

.inbox-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inbox-contact-panel {
  border-left: 1px solid var(--ka-border);
  background: var(--ka-surface);
  padding: 16px;
  overflow-y: auto;
}

.inbox-contact-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.inbox-contact-panel-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
}

.inbox-contact-profile {
  text-align: center;
  margin-bottom: 20px;
}

.inbox-contact-profile h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 12px 0 4px;
}

.inbox-contact-profile p {
  font-size: 13px;
  color: var(--ka-fg-3);
  margin: 0;
}

.inbox-contact-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}

.inbox-contact-details {
  margin-bottom: 20px;
}

.inbox-contact-details div {
  padding: 10px 0;
  border-bottom: 1px solid var(--ka-border);
}

.inbox-contact-details dt {
  font-size: 11px;
  font-weight: 600;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  margin: 0 0 4px;
}

.inbox-contact-details dd {
  font-size: 13px;
  color: var(--ka-fg);
  margin: 0;
}

.inbox-contact-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.inbox-tag {
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--ka-gray-100);
  font-size: 12px;
  color: var(--ka-fg-2);
}

.inbox-no-tags {
  font-size: 12px;
  color: var(--ka-fg-3);
}

.inbox-contact-deal-section {
  margin-top: 16px;
}

.inbox-contact-section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  margin: 0 0 8px;
}

.inbox-contact-deal {
  padding: 12px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  cursor: pointer;
  transition: border-color 0.2s;
}

.inbox-contact-deal:hover {
  border-color: var(--ka-brand);
}

.inbox-contact-deal-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.inbox-contact-deal-top strong {
  font-size: 13px;
  color: var(--ka-fg);
}

.inbox-deal-score {
  padding: 2px 6px;
  border-radius: var(--ka-r-sm);
  background: var(--ka-brand-alpha);
  color: var(--ka-brand-dark);
  font-size: 11px;
  font-weight: 600;
}

.inbox-contact-deal-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.inbox-deal-stage {
  color: var(--ka-fg-3);
}

.inbox-deal-value {
  color: var(--ka-success);
  font-weight: 600;
}

.inbox-no-deal {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin: 0;
}
</style>
