<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Empresas</p>
        <h1>Empresas e funções ativas</h1>
        <p>Controle plano, status da IA, WhatsApp e módulos liberados para cada empresa.</p>
      </div>
      <div class="super-admin-actions">
        <button type="button" @click="loadCompanies">
          <Icon name="refresh" :size="15" />
          Atualizar
        </button>
      </div>
    </header>

    <div class="super-admin-grid">
      <section class="super-admin-panel">
        <div class="panel-title">
          <div>
            <h2>Operação por empresa</h2>
            <p>{{ companies.length }} registros carregados</p>
          </div>
          <input v-model="search" placeholder="Buscar empresa ou admin" @keydown.enter="loadCompanies" />
        </div>

        <div class="ops-table">
          <div v-for="company in companies" :key="company.id" class="ops-row">
            <div class="company-logo">
              <img v-if="company.logoUrl" :src="company.logoUrl" alt="" />
              <span v-else>{{ initials(company.name) }}</span>
            </div>
            <div style="min-width:0;">
              <strong>{{ company.name }}</strong>
              <span>{{ company.adminUser?.email || "Sem admin" }}</span>
            </div>
            <span style="font-size:12px;color:var(--ka-fg-2);">{{ company.operationalStatus?.planName || "Sem plano" }}</span>
            <span class="status-pill" :class="{ off: !company.operationalStatus?.agentActive }">IA {{ company.operationalStatus?.agentActive ? "ativa" : "off" }}</span>
            <span class="status-pill" :class="{ off: !company.operationalStatus?.whatsappConnected }">WhatsApp {{ company.operationalStatus?.whatsappStatus || "off" }}</span>
            <span class="status-pill" :class="{ off: !company.active }">{{ company.active ? "Ativa" : "Suspensa" }}</span>
            <!-- Ações -->
            <div class="ops-row-actions">
              <button
                class="ts-icon-btn"
                title="Editar empresa"
                @click="navigateTo(`/super-admin/companies/${company.id}`)"
              >
                <Icon name="edit" :size="15" />
              </button>
              <button
                class="ts-icon-btn ops-delete-btn"
                title="Excluir empresa"
                :disabled="deletingId === company.id"
                @click="confirmDelete(company)"
              >
                <Icon name="trash" :size="15" />
              </button>
            </div>
          </div>
        </div>

        <!-- Modal de confirmação de exclusão -->
        <div v-if="deleteTarget" class="sa-confirm-overlay" @click.self="deleteTarget = null">
          <div class="sa-confirm-modal">
            <div class="sa-confirm-icon">
              <Icon name="alert" :size="24" color="var(--ka-danger)" />
            </div>
            <h3>Excluir empresa?</h3>
            <p>
              Você está prestes a excluir <strong>{{ deleteTarget.name }}</strong>.
              Esta ação não pode ser desfeita e removerá todos os dados da empresa.
            </p>
            <div class="sa-confirm-actions">
              <button class="btn secondary" type="button" @click="deleteTarget = null">Cancelar</button>
              <button class="btn danger" type="button" :disabled="deletingId === deleteTarget.id" @click="deleteCompany">
                {{ deletingId === deleteTarget.id ? 'Excluindo...' : 'Sim, excluir' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="super-admin-panel">
        <h2>Cadastrar empresa</h2>
        <p>Cria empresa, usuário ADMIN, assistente IA e pipeline inicial.</p>
        <form class="stack-form" @submit.prevent="createCompany">
          <label>Empresa<input v-model="form.name" required /></label>
          <label>Nome do admin<input v-model="form.adminName" required /></label>
          <label>E-mail do admin<input v-model="form.adminEmail" type="email" required /></label>
          <label>Senha inicial<input v-model="form.adminPassword" type="password" required /></label>
          <label>Logo URL<input v-model="form.logoUrl" placeholder="https://..." /></label>
          <label>Plano
            <select v-model="form.planId">
              <option value="">Sem plano inicial</option>
              <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
            </select>
          </label>
          <div class="feature-toggles">
            <label><input v-model="form.aiEnabled" type="checkbox" /> IA</label>
            <label><input v-model="form.whatsappEnabled" type="checkbox" /> WhatsApp</label>
            <label><input v-model="form.karisLinkEnabled" type="checkbox" /> Karis Link</label>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <button class="primary-action" type="submit" :disabled="saving">{{ saving ? "Criando..." : "Cadastrar empresa" }}</button>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const api = useAdminApi()
const toast = useToast()
const companies = ref<any[]>([])
const plans = ref<any[]>([])
const search = ref("")
const saving = ref(false)
const formError = ref("")
const deleteTarget = ref<any | null>(null)
const deletingId = ref<string | null>(null)

const form = reactive({
  name: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  logoUrl: "",
  planId: "",
  aiEnabled: true,
  whatsappEnabled: true,
  karisLinkEnabled: true,
})

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()
}

async function loadCompanies() {
  const data = await api.fetch<{ companies: any[] }>(`/companies?take=100&search=${encodeURIComponent(search.value)}`)
  companies.value = data.companies
}

async function loadPlans() {
  const data = await api.fetch<{ plans: any[] }>("/plans?includeInactive=1")
  plans.value = data.plans
}

async function createCompany() {
  saving.value = true
  formError.value = ""
  try {
    await api.fetch("/companies", {
      method: "POST",
      body: JSON.stringify({ ...form, logoUrl: form.logoUrl || null, planId: form.planId || null }),
    })
    Object.assign(form, { name: "", adminName: "", adminEmail: "", adminPassword: "", logoUrl: "", planId: "", aiEnabled: true, whatsappEnabled: true, karisLinkEnabled: true })
    toast.success("Empresa cadastrada com sucesso.")
    await loadCompanies()
  } catch (err: any) {
    formError.value = err?.data?.message || "Não foi possível cadastrar."
  } finally {
    saving.value = false
  }
}

function confirmDelete(company: any) {
  deleteTarget.value = company
}

async function deleteCompany() {
  if (!deleteTarget.value) return
  deletingId.value = deleteTarget.value.id
  try {
    await api.fetch(`/companies/${deleteTarget.value.id}`, { method: "DELETE" })
    toast.success(`Empresa "${deleteTarget.value.name}" excluída.`)
    deleteTarget.value = null
    await loadCompanies()
  } catch (err: any) {
    toast.error(err?.data?.message || "Não foi possível excluir a empresa.")
  } finally {
    deletingId.value = null
  }
}

onMounted(() => Promise.all([loadCompanies(), loadPlans()]))
</script>
