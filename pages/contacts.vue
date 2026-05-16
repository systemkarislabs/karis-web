<template>
  <div class="contacts-page">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Contatos</p>
        <h1 class="page-title">Base de clientes</h1>
        <p class="page-subtitle">{{ contacts.length }} contatos · {{ optedInCount }} ativos · {{ pendingCount }} aguardando você</p>
      </div>
      <div class="page-actions">
        <Button variant="secondary" size="sm">
          <Icon name="upload" :size="16" />
          Importar CSV
        </Button>
        <Button size="sm">
          <Icon name="plus" :size="16" />
          Novo contato
        </Button>
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
          {{ f.label }}
        </button>
      </div>
      <div class="toolbar-actions">
        <Button variant="ghost" size="sm">
          <Icon name="filter" :size="16" />
          Mais filtros
        </Button>
        <Button variant="ghost" size="sm">
          <Icon name="download" :size="16" />
          Exportar
        </Button>
        <Button variant="ghost" size="icon" @click="loadContacts">
          <Icon name="refresh" :size="16" />
        </Button>
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
                <Avatar :name="contact.name || contact.phone" size="sm" />
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
                >{{ tag }}</span>
              </div>
            </td>
            <td>
              <span class="contacts-status">
                <span class="contacts-status-dot" :class="{ 'contacts-status-dot-active': contact.optedInWhatsapp }" />
                {{ contact.optedInWhatsapp ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="contacts-table-time">{{ contact.updatedAt ? relativeTime(contact.updatedAt) : '—' }}</td>
            <td>
              <span
                v-if="contact.aiScore"
                class="contacts-ai-score"
                :class="aiScoreClass(contact.aiScore)"
              >{{ contact.aiScore }}</span>
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
              <Avatar :name="drawerContact.name || drawerContact.phone" size="md" />
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
                <span v-for="tag in drawerContact.tags" :key="tag" class="drawer-tag">{{ tag }}</span>
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

const chipFilters = [
  { key: "all",      label: "Todos" },
  { key: "active",   label: "Ativos" },
  { key: "pending",  label: "Aguardando" },
  { key: "vip",      label: "VIP" },
  { key: "leads",    label: "Só leads" },
  { key: "inactive", label: "Inativos 30d+" },
];

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

function aiScoreClass(score: number) {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cool";
}

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

