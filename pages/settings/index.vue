<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Configurações</p>
        <h1 class="page-title">Configurações</h1>
        <p class="page-subtitle">Empresa, time, integrações e cobrança.</p>
      </div>
    </div>

    <div class="settings-layout">
      <nav class="settings-nav">
        <h6 class="settings-nav-label">Workspace</h6>
        <button
          v-for="item in workspaceNav"
          :key="item.key"
          class="settings-nav-item"
          :class="{ 'settings-nav-item-active': activeSection === item.key }"
          type="button"
          @click="activeSection = item.key"
        >
          <Icon :name="item.icon" :size="16" />
          {{ item.label }}
          <span v-if="item.badge" class="settings-nav-badge">{{ item.badge }}</span>
        </button>
        <h6 class="settings-nav-label" style="margin-top: 16px;">Conta</h6>
        <button
          v-for="item in contaNav"
          :key="item.key"
          class="settings-nav-item"
          :class="{ 'settings-nav-item-active': activeSection === item.key }"
          type="button"
          @click="activeSection = item.key"
        >
          <Icon :name="item.icon" :size="16" />
          {{ item.label }}
        </button>
      </nav>

      <div class="settings-content">
        <template v-if="activeSection === 'empresa'">
          <!-- Dados da empresa -->
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Dados da empresa</h3>
                <p class="settings-card-desc">Aparecem nas suas mensagens automáticas e no recibo.</p>
              </div>
              <Button size="sm" :loading="savingBusiness" @click="saveBusiness">Salvar</Button>
            </div>
            <div v-if="loadingBusiness" class="settings-card-skeletons">
              <Skeleton v-for="i in 5" :key="i" height="40px" rounded="md" />
            </div>
            <template v-else>
              <!-- Logo -->
              <div class="settings-logo-row">
                <div class="settings-logo-preview" :style="logoPreview ? { backgroundImage: `url(${logoPreview})`, backgroundSize: 'cover' } : {}">
                  <span v-if="!logoPreview" class="settings-logo-initials">{{ initials(business.legalName || business.tradeName || 'KA') }}</span>
                </div>
                <div class="settings-logo-info">
                  <div class="settings-logo-label">Logo da empresa</div>
                  <div class="settings-logo-hint">Recomendado: PNG 256×256, fundo transparente.</div>
                  <div class="settings-logo-actions">
                    <label class="settings-logo-btn" for="logo-upload">
                      <Icon name="upload" :size="14" />Trocar logo
                    </label>
                    <input id="logo-upload" type="file" accept="image/*" style="display:none" @change="onLogoChange" />
                    <button v-if="logoPreview" class="settings-logo-remove" type="button" @click="logoPreview = ''">Remover</button>
                  </div>
                </div>
              </div>

              <div class="settings-form-grid">
                <div class="form-group">
                  <label class="form-label">Razão social</label>
                  <input v-model="business.legalName" class="form-input" placeholder="Padaria do João LTDA" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nome fantasia</label>
                  <input v-model="business.tradeName" class="form-input" placeholder="Padaria do João" />
                </div>
                <div class="form-group">
                  <label class="form-label">CNPJ</label>
                  <input v-model="business.cnpj" class="form-input" placeholder="12.345.678/0001-90" />
                </div>
                <div class="form-group">
                  <label class="form-label">Telefone comercial</label>
                  <input v-model="business.commercialPhone" class="form-input" placeholder="+55 41 3322-1100" />
                </div>
                <div class="form-group">
                  <label class="form-label">Fuso horário</label>
                  <select v-model="business.timezone" class="form-input form-select">
                    <option value="America/Sao_Paulo">(GMT-03:00) Brasília</option>
                    <option value="America/Manaus">(GMT-04:00) Manaus</option>
                    <option value="America/Belem">(GMT-03:00) Belém</option>
                    <option value="America/Fortaleza">(GMT-03:00) Fortaleza</option>
                    <option value="America/Recife">(GMT-03:00) Recife</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Setor</label>
                  <select v-model="business.sector" class="form-input form-select">
                    <option value="">Selecione...</option>
                    <option>Alimentação</option>
                    <option>E-commerce</option>
                    <option>Saúde</option>
                    <option>Educação</option>
                    <option>Serviços</option>
                    <option>Varejo</option>
                    <option>Tecnologia</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div class="form-group-full">
                  <label class="form-label">Descrição <span class="form-label-sub">(usada pela IA)</span></label>
                  <textarea v-model="business.description" class="form-textarea" rows="4" placeholder="Descreva sua empresa em poucas palavras..." />
                  <p class="form-hint">Essa descrição é injetada nas instruções da IA. Quanto mais específica, melhor a resposta.</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Endereço -->
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Endereço</h3>
                <p class="settings-card-desc">Aparece no rodapé das campanhas, conforme exige a LGPD.</p>
              </div>
              <Button size="sm" :loading="savingBusiness" @click="saveBusiness">Salvar</Button>
            </div>
            <div class="settings-form-grid">
              <div class="form-group">
                <label class="form-label">CEP</label>
                <input v-model="business.zipCode" class="form-input" placeholder="80060-150" @blur="lookupCep" />
              </div>
              <div class="form-group" />
              <div class="form-group-full">
                <label class="form-label">Endereço</label>
                <input v-model="business.address" class="form-input" placeholder="Rua XV de Novembro, 1024 — Centro" />
              </div>
              <div class="form-group">
                <label class="form-label">Cidade</label>
                <input v-model="business.city" class="form-input" placeholder="Curitiba" />
              </div>
              <div class="form-group">
                <label class="form-label">Estado</label>
                <select v-model="business.state" class="form-input form-select">
                  <option value="">Selecione...</option>
                  <option v-for="uf in ufs" :key="uf" :value="uf">{{ uf }}</option>
                </select>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'usuarios'">
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Membros da equipe</h3>
                <p class="settings-card-desc">Gerencie quem tem acesso à plataforma.</p>
              </div>
              <Button size="sm">
                <Icon name="plus" :size="16" />
                Convidar
              </Button>
            </div>
            <div v-if="loadingTeam" class="settings-card-skeletons">
              <Skeleton v-for="i in 3" :key="i" height="48px" rounded="md" />
            </div>
            <div v-else>
              <div v-for="member in team" :key="member.id" class="settings-team-row">
                <Avatar :name="member.name || member.email" size="sm" />
                <div class="settings-team-info">
                  <div class="settings-team-name">{{ member.name || "Sem nome" }}</div>
                  <div class="settings-team-email">{{ member.email }}</div>
                </div>
                <Badge :variant="member.role === 'ADMIN' ? 'default' : 'neutral'" size="sm">
                  {{ member.role === "ADMIN" ? "Admin" : "Agente" }}
                </Badge>
              </div>
              <EmptyState v-if="!team.length" icon="users" title="Nenhum membro" description="Convide colaboradores para acessar a plataforma." />
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'whatsapp'">
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Canal WhatsApp</h3>
                <p class="settings-card-desc">Status da instância, QR Code e diagnóstico.</p>
              </div>
              <Button size="sm" @click="navigateTo('/whatsapp')">
                Gerenciar canal
                <Icon name="chevronRight" :size="16" />
              </Button>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Instância conectada</div>
                <div class="settings-switch-desc">Gerencie a conexão e reconexão com o WhatsApp na página dedicada.</div>
              </div>
              <Button variant="secondary" size="sm" @click="navigateTo('/whatsapp')">Abrir</Button>
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'agente'">
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Configurações da IA</h3>
                <p class="settings-card-desc">Personalidade, setores e base de conhecimento.</p>
              </div>
              <Button size="sm" @click="navigateTo('/agent')">
                Ir para Agente IA
                <Icon name="chevronRight" :size="16" />
              </Button>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">IA habilitada</div>
                <div class="settings-switch-desc">Quando ativa, a Karis responde automaticamente às mensagens dos clientes.</div>
              </div>
              <button class="settings-toggle" :class="{ 'settings-toggle-on': aiEnabled }" type="button" @click="aiEnabled = !aiEnabled" />
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Transferência automática</div>
                <div class="settings-switch-desc">Encaminha para humano quando a IA não tem resposta adequada.</div>
              </div>
              <button class="settings-toggle" :class="{ 'settings-toggle-on': autoTransfer }" type="button" @click="autoTransfer = !autoTransfer" />
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'integracoes'">
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Integrações</h3>
                <p class="settings-card-desc">Conecte ferramentas externas à plataforma.</p>
              </div>
            </div>
            <div class="settings-integrations">
              <div v-for="intg in integrations" :key="intg.name" class="settings-integration-row">
                <div class="settings-integration-logo">{{ intg.emoji }}</div>
                <div class="settings-integration-info">
                  <div class="settings-integration-name">{{ intg.name }}</div>
                  <div class="settings-integration-desc">{{ intg.desc }}</div>
                </div>
                <Button :variant="intg.connected ? 'success' : 'secondary'" size="sm">
                  {{ intg.connected ? "Conectado" : "Conectar" }}
                </Button>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'notificacoes'">
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Notificações</h3>
                <p class="settings-card-desc">Escolha quando e como receber alertas.</p>
              </div>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Nova mensagem recebida</div>
                <div class="settings-switch-desc">Notificação quando um cliente enviar mensagem.</div>
              </div>
              <button class="settings-toggle settings-toggle-on" type="button" />
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Transferência para humano</div>
                <div class="settings-switch-desc">Alerta quando a IA redirecionar para atendimento humano.</div>
              </div>
              <button class="settings-toggle settings-toggle-on" type="button" />
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Resumo diário</div>
                <div class="settings-switch-desc">Receba um resumo por email todo dia às 18h.</div>
              </div>
              <button class="settings-toggle" type="button" />
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Relatório semanal</div>
                <div class="settings-switch-desc">Receba métricas semanais de atendimento por email.</div>
              </div>
              <button class="settings-toggle" type="button" />
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'cobranca'">
          <div class="settings-plan-card">
            <span class="settings-plan-badge">Plano atual</span>
            <div class="settings-plan-name">{{ planName }}</div>
            <div class="settings-plan-price">{{ planPrice }}</div>
            <div class="settings-plan-usage">
              <div class="settings-plan-usage-bar">
                <div class="settings-plan-usage-label">Conversas usadas este mês</div>
                <div class="settings-plan-progress">
                  <div class="settings-plan-progress-fill" :style="{ width: `${usagePct}%` }" />
                </div>
              </div>
              <span class="settings-plan-usage-pct">{{ usagePct }}%</span>
            </div>
          </div>
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Faturamento</h3>
                <p class="settings-card-desc">Histórico de cobranças e método de pagamento.</p>
              </div>
              <Button variant="secondary" size="sm">Gerenciar assinatura</Button>
            </div>
            <EmptyState icon="creditCard" title="Sem cobranças registradas" description="Seu histórico de pagamentos aparecerá aqui." />
          </div>
        </template>

        <template v-if="activeSection === 'seguranca'">
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Segurança</h3>
                <p class="settings-card-desc">Senha, sessões ativas e autenticação de dois fatores.</p>
              </div>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Autenticação de dois fatores (2FA)</div>
                <div class="settings-switch-desc">Adiciona uma camada extra de segurança ao login.</div>
              </div>
              <Button variant="secondary" size="sm">Configurar</Button>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Alterar senha</div>
                <div class="settings-switch-desc">Última alteração: desconhecida.</div>
              </div>
              <Button variant="secondary" size="sm">Alterar</Button>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Sessões ativas</div>
                <div class="settings-switch-desc">Encerrar todos os outros dispositivos conectados.</div>
              </div>
              <Button variant="secondary" size="sm" style="color: var(--ka-danger);">Encerrar sessões</Button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const api = useApi();

const activeSection = ref("empresa");

const workspaceNav = [
  { key: "empresa",      label: "Empresa",          icon: "building" },
  { key: "usuarios",     label: "Usuários e times", icon: "users" },
  { key: "whatsapp",     label: "WhatsApp",         icon: "whatsapp", badge: "Conectar" },
  { key: "agente",       label: "Agente IA",        icon: "bot" },
  { key: "integracoes",  label: "Integrações",      icon: "zap" },
];

const contaNav = [
  { key: "notificacoes", label: "Notificações", icon: "bell" },
  { key: "cobranca",     label: "Cobrança",     icon: "card" },
  { key: "seguranca",    label: "Segurança",    icon: "shield" },
];

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const loadingBusiness = ref(false);
const savingBusiness  = ref(false);
const logoPreview     = ref("");

const business = reactive({
  legalName: "", tradeName: "", cnpj: "", commercialPhone: "",
  timezone: "America/Sao_Paulo", sector: "", description: "",
  zipCode: "", address: "", city: "", state: "",
  // backwards compat
  name: "", email: "", phone: "", website: "", segment: "",
});

function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => { logoPreview.value = ev.target?.result as string; };
  reader.readAsDataURL(file);
}

async function lookupCep() {
  const cep = business.zipCode.replace(/\D/g, "");
  if (cep.length !== 8) return;
  try {
    const data = await $fetch<any>(`https://viacep.com.br/ws/${cep}/json/`);
    if (!data.erro) {
      business.address = `${data.logradouro}${data.complemento ? ", " + data.complemento : ""} — ${data.bairro}`;
      business.city  = data.localidade;
      business.state = data.uf;
    }
  } catch { /* silently ignore */ }
}

async function loadBusiness() {
  loadingBusiness.value = true;
  try {
    const res = await api.fetch<any>("/settings/business");
    const b = res.business || res;
    Object.assign(business, b);
    if (b.legalName || b.tradeName) {
      business.legalName = b.legalName || b.name || "";
      business.tradeName = b.tradeName || "";
    }
    if (b.logoUrl) logoPreview.value = b.logoUrl;
  } catch { /* silently ignore */ } finally {
    loadingBusiness.value = false;
  }
}

async function saveBusiness() {
  savingBusiness.value = true;
  try {
    await api.fetch("/settings/business", { method: "PUT", body: JSON.stringify(business) });
  } catch { /* silently ignore */ } finally {
    savingBusiness.value = false;
  }
}

const loadingTeam = ref(false);
const team = ref<any[]>([]);

async function loadTeam() {
  loadingTeam.value = true;
  try {
    const res = await api.fetch<any>("/companies/me/users");
    team.value = res.users || res || [];
  } catch { team.value = []; } finally {
    loadingTeam.value = false;
  }
}

const aiEnabled    = ref(true);
const autoTransfer = ref(true);

const integrations = [
  { name: "Zapier",      emoji: "⚡", desc: "Automatize fluxos com mais de 5.000 apps.",  connected: false },
  { name: "Google Sheets", emoji: "📊", desc: "Sincronize contatos e leads com planilhas.", connected: false },
  { name: "HubSpot",    emoji: "🔶", desc: "Sincronize contatos e deals com o CRM.",       connected: false },
  { name: "Webhook",    emoji: "🔗", desc: "Envie eventos para qualquer endpoint HTTP.",    connected: false },
];

const planName  = ref("Profissional");
const planPrice = ref("R$ 297/mês");
const usagePct  = ref(42);

watch(activeSection, (section) => {
  if (section === "empresa" && !business.name) loadBusiness();
  if (section === "usuarios" && !team.value.length) loadTeam();
}, { immediate: true });
</script>

<style scoped>
.settings-page {
  max-width: 1000px;
}

.page-header {
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

.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-nav-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ka-fg-3);
  margin: 0 0 8px;
  padding: 0 12px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--ka-r-sm);
  background: transparent;
  font-size: 14px;
  color: var(--ka-fg-2);
  cursor: pointer;
  text-align: left;
}

.settings-nav-item:hover {
  background: var(--ka-gray-50);
  color: var(--ka-fg);
}

.settings-nav-item-active {
  background: var(--ka-brand-alpha);
  color: var(--ka-brand-dark);
  font-weight: 600;
}

.settings-nav-badge {
  margin-left: auto;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--ka-success-alpha);
  color: var(--ka-success);
  font-size: 10px;
  font-weight: 600;
}

.settings-content {
  min-width: 0;
}

.settings-card {
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-surface);
  padding: 24px;
  margin-bottom: 16px;
}

.settings-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.settings-card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0;
}

.settings-card-desc {
  font-size: 13px;
  color: var(--ka-fg-3);
  margin: 4px 0 0;
}

.settings-card-skeletons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-fg-2);
}

.form-input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-surface);
  font-size: 14px;
  color: var(--ka-fg);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 3px var(--ka-brand-alpha);
}

.form-textarea {
  padding: 10px 12px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-surface);
  font-size: 14px;
  color: var(--ka-fg);
  outline: none;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 3px var(--ka-brand-alpha);
}

.form-hint {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin: 4px 0 0;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 32px;
  cursor: pointer;
}

.form-label-sub {
  font-size: 11px;
  font-weight: 400;
  color: var(--ka-fg-3);
}

.settings-logo-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-gray-50);
  margin-bottom: 20px;
}

.settings-logo-preview {
  width: 56px;
  height: 56px;
  border-radius: var(--ka-r-md);
  background: var(--ka-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-logo-initials {
  font-size: 18px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.02em;
}

.settings-logo-info {
  flex: 1;
}

.settings-logo-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ka-fg);
}

.settings-logo-hint {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 2px;
}

.settings-logo-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.settings-logo-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-surface);
  font-size: 12px;
  font-weight: 500;
  color: var(--ka-fg-2);
  cursor: pointer;
}

.settings-logo-btn:hover {
  background: var(--ka-gray-50);
}

.settings-logo-remove {
  padding: 5px 12px;
  border: none;
  border-radius: var(--ka-r-sm);
  background: transparent;
  font-size: 12px;
  color: var(--ka-danger);
  cursor: pointer;
}

.settings-logo-remove:hover {
  background: var(--ka-danger-alpha);
}

.settings-team-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--ka-r-sm);
}

.settings-team-row:hover {
  background: var(--ka-gray-50);
}

.settings-team-info {
  flex: 1;
  min-width: 0;
}

.settings-team-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
}

.settings-team-email {
  font-size: 12px;
  color: var(--ka-fg-3);
}

.settings-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--ka-border);
}

.settings-switch-row:last-child {
  border-bottom: none;
}

.settings-switch-text {
  flex: 1;
}

.settings-switch-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
}

.settings-switch-desc {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 2px;
}

.settings-toggle {
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: var(--ka-gray-200);
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.settings-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.settings-toggle-on {
  background: var(--ka-brand);
}

.settings-toggle-on::after {
  transform: translateX(20px);
}

.settings-integrations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-integration-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
}

.settings-integration-logo {
  width: 40px;
  height: 40px;
  border-radius: var(--ka-r-md);
  background: var(--ka-gray-50);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.settings-integration-info {
  flex: 1;
  min-width: 0;
}

.settings-integration-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
}

.settings-integration-desc {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 2px;
}

.settings-plan-card {
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-surface);
  padding: 24px;
  margin-bottom: 16px;
}

.settings-plan-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--ka-brand-alpha);
  color: var(--ka-brand-dark);
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
}

.settings-plan-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--ka-fg);
}

.settings-plan-price {
  font-size: 14px;
  color: var(--ka-fg-2);
  margin-top: 2px;
}

.settings-plan-usage {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.settings-plan-usage-bar {
  flex: 1;
}

.settings-plan-usage-label {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-bottom: 8px;
}

.settings-plan-progress {
  height: 8px;
  border-radius: 4px;
  background: var(--ka-gray-100);
  overflow: hidden;
}

.settings-plan-progress-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--ka-brand);
  transition: width 0.3s;
}

.settings-plan-usage-pct {
  font-size: 15px;
  font-weight: 700;
  color: var(--ka-fg);
}
</style>
