<template>
  <div class="contacts-page">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Base de clientes</p>
        <h1 class="page-title">Contatos</h1>
        <p class="page-subtitle">{{ contacts.length }} contatos · {{ optedInCount }} ativos · {{ pendingCount }} aguardando você</p>
      </div>
      <div class="page-actions">
        <button class="btn secondary" type="button">
          <Icon name="upload" :size="16" />
          Importar CSV
        </button>
        <button class="btn primary" type="button" @click="showNewContactModal = true">
          <Icon name="plus" :size="16" />
          Novo contato
        </button>
      </div>
    </div>

    <div class="contacts-stat-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-brand-alpha); color: var(--ka-brand);">
          <Icon name="users" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">{{ contacts.length }}</div>
          <div class="stat-label">Contatos totais</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-success-alpha); color: var(--ka-success);">
          <Icon name="trendUp" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">+{{ newThisWeek }}</div>
          <div class="stat-label">Novos esta semana</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-warning-alpha); color: var(--ka-warning);">
          <Icon name="clock" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">Aguardando resposta</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--ka-brand-alpha); color: var(--ka-brand);">
          <Icon name="star" :size="20" />
        </div>
        <div class="stat-text">
          <div class="stat-value">{{ vipCount }}</div>
          <div class="stat-label">Contatos VIP</div>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-search">
        <Icon name="search" :size="16" class="toolbar-search-icon" />
        <input v-model="search" class="toolbar-search-input" placeholder="Buscar nome ou telefone…" />
      </div>
      <div class="toolbar-chips">
        <button
          v-for="f in chipFilters"
          :key="f.key"
          class="toolbar-chip"
          :class="{ 'toolbar-chip-active': activeChip === f.key }"
          type="button"
          @click="activeChip = f.key; page = 1"
        >
          {{ f.label }}<span v-if="f.count !== undefined" class="chip-count">{{ f.count }}</span>
        </button>
      </div>
      <div class="toolbar-actions">
        <button class="btn secondary" type="button">
          <Icon name="filter" :size="15" />
          Mais filtros
        </button>
        <button class="btn secondary" type="button">
          <Icon name="download" :size="15" />
          Exportar
        </button>
      </div>
    </div>

    <div v-if="selected.size > 0" class="bulk-bar">
      <span class="bulk-bar-text">{{ selected.size }} selecionado{{ selected.size > 1 ? 's' : '' }}</span>
      <Button variant="secondary" size="sm"><Icon name="tag" :size="16" />Adicionar tag</Button>
      <Button variant="secondary" size="sm"><Icon name="megaphone" :size="16" />Enviar campanha</Button>
      <Button variant="secondary" size="sm" style="color: var(--ka-danger);">
        <Icon name="archive" :size="16" />Arquivar
      </Button>
      <Button variant="ghost" size="sm" class="bulk-bar-clear" @click="selected = new Set()">
        Limpar seleção
      </Button>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeletons">
        <Skeleton v-for="i in 8" :key="i" height="56px" rounded="md" />
      </div>

      <table v-else class="contacts-table">
        <thead>
          <tr>
            <th class="contacts-table-check">
              <input
                type="checkbox"
                :checked="selected.size === pagedContacts.length && pagedContacts.length > 0"
                @change="toggleAll"
              />
            </th>
            <th>Nome</th>
            <th>Canal</th>
            <th>Tags</th>
            <th>Status</th>
            <th>Última conversa</th>
            <th>Score IA</th>
            <th class="contacts-table-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="contact in pagedContacts"
            :key="contact.id"
            :class="{ 'contacts-table-row-selected': selected.has(contact.id) }"
            @click="openDrawer(contact)"
          >
            <td class="contacts-table-check" @click.stop>
              <input
                type="checkbox"
                :checked="selected.has(contact.id)"
                @change="toggleSelect(contact.id)"
              />
            </td>
            <td>
              <div class="contacts-name-cell">
                <div class="ct-avatar" :style="{ background: avatarColor(contact.name || contact.phone) }">
                  {{ initials(contact.name || contact.phone) }}
                </div>
                <div>
                  <div class="contacts-name-cell-name">{{ contact.name || "Sem nome" }}</div>
                  <div class="contacts-name-cell-phone">{{ contact.phone || "" }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="contacts-channel">
                <span class="contacts-channel-dot" />
                WhatsApp
              </span>
            </td>
            <td>
              <div class="contacts-tags">
                <span
                  v-for="tag in (contact.tags || []).slice(0, 3)"
                  :key="tag"
                  class="contacts-tag"
                  :style="tagStyle(tag)"
                >{{ tag }}</span>
              </div>
            </td>
            <td>
              <span class="contacts-status">
                <span class="contacts-status-dot" :style="{ background: contactStatusColor(contact) }" />
                {{ contactStatusLabel(contact) }}
              </span>
            </td>
            <td class="contacts-table-time">{{ contact.updatedAt ? relativeTime(contact.updatedAt) : '—' }}</td>
            <td>
              <span v-if="contact.aiScore" class="contacts-ai-score">{{ contact.aiScore }}</span>
              <span v-else class="contacts-table-empty">—</span>
            </td>
            <td class="contacts-table-actions" @click.stop>
              <button class="contacts-table-action-btn" @click="openDrawer(contact)">
                <Icon name="moreH" :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && totalPages > 1" class="pagination">
        <span>Mostrando {{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, filteredContacts.length) }} de {{ filteredContacts.length }} contatos</span>
        <div class="pagination-pages">
          <button class="pagination-btn" type="button" :disabled="page === 1" @click="page--">‹</button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="pagination-btn"
            :class="{ 'pagination-btn-active': p === page }"
            type="button"
            @click="page = p"
          >{{ p }}</button>
          <button class="pagination-btn" type="button" :disabled="page === totalPages" @click="page++">›</button>
        </div>
      </div>

      <EmptyState v-if="!loading && !filteredContacts.length" icon="users" title="Nenhum contato encontrado" description="A busca não encontrou registros nesta conta." />
    </div>

    <Teleport to="body">
      <template v-if="drawerContact">
        <div class="drawer-backdrop" @click="drawerContact = null" />
        <aside class="drawer">
          <div class="drawer-header">
            <div class="drawer-header-info">
              <div class="ct-avatar ct-avatar-lg" :style="{ background: avatarColor(drawerContact.name || drawerContact.phone) }">
                {{ initials(drawerContact.name || drawerContact.phone) }}
              </div>
              <div>
                <h3 class="drawer-contact-name">{{ drawerContact.name || "Sem nome" }}</h3>
                <div class="drawer-contact-phone">{{ drawerContact.phone }}</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" @click="drawerContact = null">
              <Icon name="x" :size="18" />
            </Button>
          </div>

          <div class="drawer-body">
            <div class="drawer-actions">
              <Button size="sm" class="drawer-action-btn" @click="navigateTo('/inbox')">
                <Icon name="message" :size="16" />Conversar
              </Button>
              <Button variant="secondary" size="sm" class="drawer-action-btn">
                <Icon name="phone" :size="16" />Ligar
              </Button>
              <Button variant="secondary" size="icon">
                <Icon name="moreH" :size="16" />
              </Button>
            </div>

            <div class="drawer-section">
              <h5 class="drawer-section-title">Resumo</h5>
              <div class="drawer-summary">
                <div class="drawer-summary-card">
                  <div class="drawer-summary-label">Total gasto</div>
                  <div class="drawer-summary-value">{{ drawerContact.lastPurchaseAt ? formatMoney(drawerContact.totalSpentCents || 0) : 'R$ 0' }}</div>
                </div>
                <div class="drawer-summary-card">
                  <div class="drawer-summary-label">Negócios</div>
                  <div class="drawer-summary-value">{{ drawerContact.dealsCount ?? 0 }}</div>
                </div>
              </div>
            </div>

            <div v-if="(drawerContact.tags || []).length" class="drawer-section">
              <h5 class="drawer-section-title">Tags</h5>
              <div class="drawer-tags">
                <span v-for="tag in drawerContact.tags" :key="tag" class="drawer-tag" :style="tagStyle(tag)">{{ tag }}</span>
                <button class="drawer-tag-add">
                  <Icon name="plus" :size="12" />Adicionar
                </button>
              </div>
            </div>

            <div class="drawer-section">
              <h5 class="drawer-section-title">Informações</h5>
              <div class="drawer-info">
                <div class="drawer-info-row">
                  <span class="drawer-info-label">Canal</span>
                  <span class="drawer-info-value">
                    <span class="contacts-channel-dot" />
                    WhatsApp
                  </span>
                </div>
                <div class="drawer-info-row">
                  <span class="drawer-info-label">Email</span>
                  <span class="drawer-info-value">{{ drawerContact.email || 'Não informado' }}</span>
                </div>
                <div class="drawer-info-row">
                  <span class="drawer-info-label">Score da IA</span>
                  <span class="drawer-info-value">{{ drawerContact.aiScore ? `${drawerContact.aiScore}/100` : '—' }}</span>
                </div>
                <div class="drawer-info-row">
                  <span class="drawer-info-label">Última conversa</span>
                  <span class="drawer-info-value">{{ drawerContact.updatedAt ? relativeTime(drawerContact.updatedAt) : '—' }}</span>
                </div>
                <div class="drawer-info-row">
                  <span class="drawer-info-label">1º contato</span>
                  <span class="drawer-info-value">{{ drawerContact.createdAt ? formatDate(drawerContact.createdAt) : '—' }}</span>
                </div>
                <div v-if="drawerContact.city || drawerContact.state" class="drawer-info-row">
                  <span class="drawer-info-label">Cidade</span>
                  <span class="drawer-info-value">{{ [drawerContact.city, drawerContact.state].filter(Boolean).join(', ') }}</span>
                </div>
              </div>
            </div>

            <div class="drawer-section">
              <h5 class="drawer-section-title">Atividade recente</h5>
              <div class="drawer-activity">
                <div class="drawer-activity-item">
                  <div class="drawer-activity-icon" style="background: var(--ka-brand-alpha); color: var(--ka-brand);">
                    <Icon name="sparkles" :size="14" />
                  </div>
                  <div>
                    <div class="drawer-activity-title">A IA respondeu sobre horário</div>
                    <div class="drawer-activity-time">{{ relativeTime(drawerContact.updatedAt || drawerContact.createdAt) }}</div>
                  </div>
                </div>
                <div class="drawer-activity-item">
                  <div class="drawer-activity-icon" style="background: var(--ka-brand-alpha); color: var(--ka-brand);">
                    <Icon name="message" :size="14" />
                  </div>
                  <div>
                    <div class="drawer-activity-title">Conversa aberta no WhatsApp</div>
                    <div class="drawer-activity-time">{{ formatDate(drawerContact.createdAt) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <Button variant="ghost" class="drawer-footer-btn" @click="drawerContact = null">Fechar</Button>
            <Button variant="secondary" class="drawer-footer-btn">
              <Icon name="edit" :size="16" />Editar
            </Button>
          </div>
        </aside>
      </template>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const api = useApi();
const loading = ref(true);
const contacts = ref<any[]>([]);
const drawerContact = ref<any | null>(null);
const search = ref("");
const activeChip = ref("all");
const page = ref(1);
const perPage = 20;
let selected = ref(new Set<string>());

const TAG_PALETTES: Record<string, { bg: string; color: string }> = {
  vip:           { bg: "#f3f0ff", color: "#7c3aed" },
  lead:          { bg: "#eff6ff", color: "#2563eb" },
  recente:       { bg: "#f0fdf4", color: "#15803d" },
  urgente:       { bg: "#fefce8", color: "#a16207" },
  "cliente-fiel":{ bg: "#eff6ff", color: "#2563eb" },
  inativo:       { bg: "#fff7ed", color: "#c2410c" },
};

const TAG_DEFAULT = { bg: "#f1f5f9", color: "#475569" };

function tagStyle(tag: string) {
  const p = TAG_PALETTES[tag.toLowerCase()] || TAG_DEFAULT;
  return { background: p.bg, color: p.color };
}

const AVATAR_COLORS = [
  "#7c3aed","#2563eb","#0891b2","#059669","#d97706","#dc2626","#db2777","#6366f1",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + (name || "").charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function contactStatusLabel(contact: any) {
  if (!contact.optedInWhatsapp) {
    const cutoff = Date.now() - 30 * 86400_000;
    if (contact.updatedAt && new Date(contact.updatedAt).getTime() < cutoff) return "Inativo";
    return "Aguardando";
  }
  return "Ativo";
}

function contactStatusColor(contact: any) {
  const label = contactStatusLabel(contact);
  if (label === "Ativo") return "var(--ka-success)";
  if (label === "Aguardando") return "var(--ka-warning)";
  return "var(--ka-fg-3)";
}

const chipFilters = computed(() => {
  const all = contacts.value;
  const cutoff = Date.now() - 30 * 86400_000;
  return [
    { key: "all",      label: "Todos",       count: all.length },
    { key: "active",   label: "Ativos",      count: all.filter(c => c.optedInWhatsapp).length },
    { key: "pending",  label: "Aguardando",  count: all.filter(c => !c.optedInWhatsapp).length },
    { key: "vip",      label: "VIP",         count: all.filter(c => (c.tags || []).includes("vip")).length },
    { key: "leads",    label: "Só leads",    count: all.filter(c => (c.tags || []).includes("lead")).length },
    { key: "inactive", label: "Inativos 30d+", count: all.filter(c => c.updatedAt && new Date(c.updatedAt).getTime() < cutoff).length },
  ];
});

const optedInCount  = computed(() => contacts.value.filter(c => c.optedInWhatsapp).length);
const pendingCount  = computed(() => contacts.value.filter(c => !c.optedInWhatsapp).length);
const vipCount      = computed(() => contacts.value.filter(c => (c.tags || []).includes("vip")).length);
const newThisWeek   = computed(() => {
  const cutoff = Date.now() - 7 * 86400_000;
  return contacts.value.filter(c => c.createdAt && new Date(c.createdAt).getTime() > cutoff).length;
});

const filteredContacts = computed(() => {
  const q = search.value.trim().toLowerCase();
  return contacts.value.filter(c => {
    if (activeChip.value === "active"   && !c.optedInWhatsapp) return false;
    if (activeChip.value === "pending"  && c.optedInWhatsapp)  return false;
    if (activeChip.value === "vip"      && !(c.tags || []).includes("vip"))  return false;
    if (activeChip.value === "leads"    && !(c.tags || []).includes("lead")) return false;
    if (activeChip.value === "inactive") {
      const cutoff = Date.now() - 30 * 86400_000;
      if (!c.updatedAt || new Date(c.updatedAt).getTime() > cutoff) return false;
    }
    if (!q) return true;
    return `${c.name || ""} ${c.phone || ""} ${c.email || ""}`.toLowerCase().includes(q);
  });
});

const totalPages    = computed(() => Math.ceil(filteredContacts.value.length / perPage));
const pagedContacts = computed(() => filteredContacts.value.slice((page.value - 1) * perPage, page.value * perPage));

watch(filteredContacts, () => { page.value = 1; });

function toggleSelect(id: string) {
  const s = new Set(selected.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selected.value = s;
}

function toggleAll() {
  if (selected.value.size === pagedContacts.value.length) {
    selected.value = new Set();
  } else {
    selected.value = new Set(pagedContacts.value.map(c => c.id));
  }
}

function openDrawer(contact: any) {
  drawerContact.value = contact;
}

async function loadContacts() {
  loading.value = true;
  try {
    contacts.value = unwrapList(await api.fetch<any>("/contacts?limit=200"), ["contacts"]);
  } finally {
    loading.value = false;
  }
}

onMounted(loadContacts);
</script>

<style scoped>
.contacts-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--ka-fg-2);
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.contacts-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .contacts-stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-surface);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--ka-r-md);
}

.stat-text {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--ka-fg);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 4px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.toolbar-search {
  position: relative;
}

.toolbar-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ka-fg-3);
  pointer-events: none;
}

.toolbar-search-input {
  height: 36px;
  padding: 0 12px 0 32px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-gray-50);
  font-size: 13px;
  color: var(--ka-fg);
  outline: none;
  width: 220px;
}

.toolbar-search-input:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 2px var(--ka-brand-alpha);
}

.toolbar-chips {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.toolbar-chip {
  padding: 6px 12px;
  border: 1px solid var(--ka-border);
  border-radius: 16px;
  background: transparent;
  font-size: 12px;
  color: var(--ka-fg-2);
  cursor: pointer;
}

.toolbar-chip:hover {
  background: var(--ka-gray-50);
}

.toolbar-chip-active {
  background: var(--ka-brand);
  border-color: var(--ka-brand);
  color: white;
  font-weight: 500;
}

.chip-count {
  margin-left: 5px;
  font-size: 11px;
  opacity: 0.75;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
  padding-left: 8px;
  border-left: 1px solid var(--ka-border);
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--ka-brand);
  border-radius: var(--ka-r-md);
  background: var(--ka-brand-alpha);
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.bulk-bar-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-brand-dark);
}

.bulk-bar-clear {
  margin-left: auto;
}

.table-wrap {
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-surface);
  overflow: hidden;
}

.table-skeletons {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contacts-table {
  width: 100%;
  border-collapse: collapse;
}

.contacts-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--ka-border);
  background: var(--ka-gray-50);
}

.contacts-table-check {
  width: 36px;
}

.contacts-table-check input {
  cursor: pointer;
}

.contacts-table td {
  padding: 12px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--ka-border);
}

.contacts-table tbody tr {
  cursor: pointer;
}

.contacts-table tbody tr:hover {
  background: var(--ka-gray-50);
}

.contacts-table-row-selected {
  background: var(--ka-brand-alpha);
}

.ct-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.ct-avatar-lg {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.contacts-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contacts-name-cell-name {
  font-weight: 500;
  color: var(--ka-fg);
}

.contacts-name-cell-phone {
  font-size: 12px;
  color: var(--ka-fg-3);
}

.contacts-channel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ka-fg-2);
}

.contacts-channel-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ka-success);
}

.contacts-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.contacts-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.contacts-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ka-fg-2);
}

.contacts-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.contacts-table-time {
  color: var(--ka-fg-3);
}

.contacts-ai-score {
  padding: 2px 8px;
  border-radius: var(--ka-r-sm);
  font-size: 12px;
  font-weight: 600;
  background: #eff6ff;
  color: #2563eb;
}

.contacts-table-empty {
  color: var(--ka-fg-3);
}

.contacts-table-actions {
  width: 40px;
}

.contacts-table-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--ka-r-sm);
  background: transparent;
  color: var(--ka-fg-3);
  cursor: pointer;
}

.contacts-table-action-btn:hover {
  background: var(--ka-gray-100);
  color: var(--ka-fg);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--ka-fg-3);
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: transparent;
  font-size: 12px;
  color: var(--ka-fg-2);
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--ka-gray-50);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn-active {
  background: var(--ka-brand);
  border-color: var(--ka-brand);
  color: white;
  font-weight: 600;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
}

.drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: var(--ka-surface);
  border-left: 1px solid var(--ka-border);
  box-shadow: var(--ka-shadow-lg);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ka-border);
}

.drawer-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-contact-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
}

.drawer-contact-phone {
  font-size: 12px;
  color: var(--ka-fg-3);
  font-family: ui-monospace, monospace;
  margin-top: 2px;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.drawer-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
}

.drawer-action-btn {
  flex: 1;
  justify-content: center;
}

.drawer-section {
  margin-bottom: 18px;
}

.drawer-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
}

.drawer-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.drawer-summary-card {
  padding: 12px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-gray-50);
}

.drawer-summary-label {
  font-size: 11px;
  color: var(--ka-fg-3);
}

.drawer-summary-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--ka-fg);
  margin-top: 4px;
}

.drawer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.drawer-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.drawer-tag-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px dashed var(--ka-border);
  border-radius: 12px;
  background: transparent;
  font-size: 11px;
  color: var(--ka-fg-3);
  cursor: pointer;
}

.drawer-tag-add:hover {
  border-color: var(--ka-brand);
  color: var(--ka-brand);
}

.drawer-info {
  display: flex;
  flex-direction: column;
}

.drawer-info-row {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid var(--ka-border);
  font-size: 13px;
}

.drawer-info-label {
  color: var(--ka-fg-3);
}

.drawer-info-value {
  font-weight: 500;
  color: var(--ka-fg);
  display: flex;
  align-items: center;
  gap: 5px;
}

.drawer-activity {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-activity-item {
  display: flex;
  gap: 10px;
}

.drawer-activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--ka-r-sm);
  flex-shrink: 0;
}

.drawer-activity-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--ka-fg);
}

.drawer-activity-time {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 2px;
}

.drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--ka-border);
  display: flex;
  gap: 8px;
}

.drawer-footer-btn {
  flex: 1;
}
</style>
