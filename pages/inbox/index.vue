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
definePageMeta({ middleware: "auth" });

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

