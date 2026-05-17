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
          <!-- Time -->
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Time</h3>
                <p class="settings-card-desc">{{ team.length }} usuário{{ team.length !== 1 ? 's' : '' }} · {{ team.length }} de 10 lugares no seu plano.</p>
              </div>
              <Button size="sm">
                <Icon name="plus" :size="16" />
                Convidar
              </Button>
            </div>
            <div v-if="loadingTeam" class="settings-card-skeletons">
              <Skeleton v-for="i in 3" :key="i" height="56px" rounded="md" />
            </div>
            <div v-else>
              <div v-for="member in team" :key="member.id" class="settings-team-row">
                <div class="st-avatar" :style="{ background: avatarColor(member.name || member.email) }">
                  {{ initials(member.name || member.email) }}
                </div>
                <div class="settings-team-info">
                  <div class="settings-team-name">
                    {{ member.name || "Sem nome" }}
                    <span v-if="member.status === 'PENDING'" class="st-pending-badge">Convite pendente</span>
                  </div>
                  <div class="settings-team-email">{{ member.email }}</div>
                </div>
                <select
                  :value="member.role"
                  class="st-role-select"
                  @change="updateMemberRole(member, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="AGENT">Atendente</option>
                  <option value="VIEWER">Visualização</option>
                </select>
                <button class="st-more-btn" type="button">
                  <Icon name="moreV" :size="16" />
                </button>
              </div>
              <EmptyState v-if="!team.length" icon="users" title="Nenhum membro" description="Convide colaboradores para acessar a plataforma." />
            </div>
          </div>

          <!-- Permissões por função -->
          <div class="settings-card">
            <div class="settings-card-header" style="margin-bottom: 16px;">
              <div>
                <h3 class="settings-card-title">Permissões por função</h3>
                <p class="settings-card-desc">Defina o que cada tipo de usuário pode ver e fazer.</p>
              </div>
            </div>
            <div class="perm-table-wrap">
              <table class="perm-table">
                <thead>
                  <tr>
                    <th class="perm-th-action"></th>
                    <th class="perm-th-role">Owner</th>
                    <th class="perm-th-role">Admin</th>
                    <th class="perm-th-role">Atend.</th>
                    <th class="perm-th-role">Visual.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="perm in permissions" :key="perm.label">
                    <td class="perm-label">{{ perm.label }}</td>
                    <td v-for="role in ['owner','admin','agent','viewer']" :key="role" class="perm-cell">
                      <span v-if="perm[role]" class="perm-check">✓</span>
                      <span v-else class="perm-x">✕</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'whatsapp'">
          <!-- Conexão -->
          <div class="settings-card">
            <div class="wa-conn-header">
              <div>
                <h3 class="settings-card-title">Conexão WhatsApp</h3>
                <p class="settings-card-desc">Sua plataforma escuta e responde mensagens deste número.</p>
              </div>
              <span class="wa-status-badge" :class="waConnected ? 'wa-status-connected' : 'wa-status-disconnected'">
                <span class="wa-status-dot" />
                {{ waConnected ? 'Conectado' : 'Desconectado' }}
              </span>
            </div>

            <div class="wa-instance-row">
              <div class="wa-wpp-icon">
                <svg viewBox="0 0 24 24" fill="white" width="26" height="26"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.13 1.535 5.862L.057 23.571a.75.75 0 0 0 .92.921l5.71-1.477A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 0 1-4.953-1.355l-.355-.21-3.688.953.978-3.585-.232-.369A9.713 9.713 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
              </div>
              <div class="wa-instance-info">
                <div class="wa-instance-phone">{{ waPhone || '+55 41 3322-1100' }}</div>
                <div class="wa-instance-meta">WABA ID: {{ waWabaId || '—' }} · {{ waConnectedSince }}</div>
              </div>
              <Button variant="secondary" size="sm" @click="reconnectWa">
                <Icon name="refresh" :size="14" />
                Reconectar
              </Button>
              <button class="wa-disconnect-btn" type="button" @click="disconnectWa">Desconectar</button>
            </div>

            <div class="wa-toggles">
              <div class="wa-toggle-row">
                <div class="settings-switch-text">
                  <div class="settings-switch-title">Mensagem de boas-vindas</div>
                  <div class="settings-switch-desc">Envia automaticamente para contatos novos.</div>
                </div>
                <button class="settings-toggle" :class="{ 'settings-toggle-on': waSettings.welcomeMsg }" type="button" @click="waSettings.welcomeMsg = !waSettings.welcomeMsg" />
              </div>
              <div class="wa-toggle-row">
                <div class="settings-switch-text">
                  <div class="settings-switch-title">Confirmação de leitura</div>
                  <div class="settings-switch-desc">Mostra "lido" pros seus clientes.</div>
                </div>
                <button class="settings-toggle" :class="{ 'settings-toggle-on': waSettings.readReceipts }" type="button" @click="waSettings.readReceipts = !waSettings.readReceipts" />
              </div>
              <div class="wa-toggle-row">
                <div class="settings-switch-text">
                  <div class="settings-switch-title">Atender fora do horário comercial</div>
                  <div class="settings-switch-desc">A IA responde dúvidas e abre tickets pra você ver de manhã.</div>
                </div>
                <button class="settings-toggle" :class="{ 'settings-toggle-on': waSettings.afterHours }" type="button" @click="waSettings.afterHours = !waSettings.afterHours" />
              </div>
              <div class="wa-toggle-row">
                <div class="settings-switch-text">
                  <div class="settings-switch-title">Modo offline</div>
                  <div class="settings-switch-desc">Pausa todas as respostas automáticas. Útil em manutenção.</div>
                </div>
                <button class="settings-toggle" :class="{ 'settings-toggle-on': waSettings.offlineMode }" type="button" @click="waSettings.offlineMode = !waSettings.offlineMode" />
              </div>
            </div>
          </div>

          <!-- Horário comercial -->
          <div class="settings-card">
            <div class="settings-card-header" style="margin-bottom: 20px;">
              <div>
                <h3 class="settings-card-title">Horário comercial</h3>
                <p class="settings-card-desc">Fora desse horário, a IA roda em modo "lite" (só responde, não cria deals).</p>
              </div>
              <Button size="sm" :loading="savingHours" @click="saveBusinessHours">Salvar</Button>
            </div>
            <div class="wa-hours-list">
              <div v-for="day in businessHours" :key="day.key" class="wa-hours-row">
                <span class="wa-hours-day">{{ day.label }}</span>
                <input v-model="day.from" type="time" class="wa-time-input" :disabled="!day.enabled" />
                <span class="wa-hours-sep">até</span>
                <input v-model="day.to" type="time" class="wa-time-input" :disabled="!day.enabled" />
                <button class="settings-toggle" :class="{ 'settings-toggle-on': day.enabled }" type="button" @click="day.enabled = !day.enabled" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'integracoes'">
          <div class="settings-card">
            <div class="intg-header">
              <div>
                <h3 class="settings-card-title">Integrações disponíveis</h3>
                <p class="settings-card-desc">Conecte as ferramentas que você já usa.</p>
              </div>
            </div>
            <div class="intg-grid">
              <div v-for="intg in integrations" :key="intg.name" class="intg-card">
                <div class="intg-icon" :style="{ background: intg.color }">
                  <span class="intg-emoji">{{ intg.emoji }}</span>
                </div>
                <div class="intg-info">
                  <div class="intg-name">{{ intg.name }}</div>
                  <div class="intg-desc">{{ intg.desc }}</div>
                </div>
                <span v-if="intg.connected" class="intg-connected-badge">
                  <Icon name="check" :size="12" />Conectado
                </span>
                <span v-else class="intg-soon-badge">Em breve</span>
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

const AVATAR_COLORS = ["#7c3aed","#2563eb","#0891b2","#059669","#d97706","#dc2626","#db2777","#6366f1"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + (name || "").charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
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

async function updateMemberRole(member: any, role: string) {
  member.role = role;
  try {
    await api.fetch(`/companies/me/users/${member.id}`, { method: "PATCH", body: JSON.stringify({ role }) });
  } catch { /* silently ignore */ }
}

const permissions = [
  { label: "Ver conversas",   owner: true,  admin: true,  agent: true,  viewer: true  },
  { label: "Responder",       owner: true,  admin: true,  agent: true,  viewer: false },
  { label: "Editar CRM",      owner: true,  admin: true,  agent: false, viewer: false },
  { label: "Treinar a IA",    owner: true,  admin: true,  agent: false, viewer: false },
  { label: "Criar campanhas", owner: true,  admin: true,  agent: false, viewer: false },
  { label: "Faturamento",     owner: true,  admin: false, agent: false, viewer: false },
  { label: "Gerenciar time",  owner: true,  admin: false, agent: false, viewer: false },
];

// WhatsApp
const waConnected      = ref(true);
const waPhone          = ref("+55 41 3322-1100");
const waWabaId         = ref("WABA IB: 91829-3829");
const waConnectedSince = ref("Diretamente há 38 dias");

const waSettings = reactive({
  welcomeMsg:   true,
  readReceipts: true,
  afterHours:   true,
  offlineMode:  false,
});

const businessHours = reactive([
  { key: "seg", label: "Segunda", from: "07:00", to: "19:00", enabled: true },
  { key: "ter", label: "Terça",   from: "07:00", to: "19:00", enabled: true },
  { key: "qua", label: "Quarta",  from: "07:00", to: "19:00", enabled: true },
  { key: "qui", label: "Quinta",  from: "07:00", to: "19:00", enabled: true },
  { key: "sex", label: "Sexta",   from: "07:00", to: "19:00", enabled: true },
  { key: "sab", label: "Sábado",  from: "09:00", to: "14:00", enabled: false },
  { key: "dom", label: "Domingo", from: "09:00", to: "14:00", enabled: false },
]);

const savingHours = ref(false);

async function saveBusinessHours() {
  savingHours.value = true;
  try {
    await api.fetch("/settings/business-hours", { method: "PUT", body: JSON.stringify({ hours: businessHours }) });
  } catch { /* silently ignore */ } finally {
    savingHours.value = false;
  }
}

async function reconnectWa() {
  try { await api.fetch("/whatsapp/reconnect", { method: "POST" }); } catch { /* silently ignore */ }
}

async function disconnectWa() {
  try { await api.fetch("/whatsapp/disconnect", { method: "POST" }); waConnected.value = false; } catch { /* silently ignore */ }
}


const integrations = [
  { name: "Mercado Pago",     emoji: "💳", color: "#009ee3", desc: "Pagamentos automáticos via pix e cartão.",      connected: false },
  { name: "Asaas",            emoji: "🟢", color: "#00b386", desc: "Cobranças recorrentes.",                        connected: false },
  { name: "Google Calendar",  emoji: "📅", color: "#4285f4", desc: "Agendamentos sincronizados.",                   connected: false },
  { name: "iFood",            emoji: "🛵", color: "#ea1d2c", desc: "Receber pedidos do iFood direto no inbox.",     connected: false },
  { name: "Shopify",          emoji: "🛍️", color: "#96bf48", desc: "Carrinho abandonado e pós-venda.",              connected: false },
  { name: "Zapier",           emoji: "⚡", color: "#ff4a00", desc: "5.000+ aplicativos via webhooks.",               connected: false },
  { name: "Slack",            emoji: "💬", color: "#4a154b", desc: "Notificações em canais do Slack.",              connected: false },
  { name: "API Karis",        emoji: "🔌", color: "#1a1a2e", desc: "Endpoint REST para integração customizada.",    connected: true  },
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

.st-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.settings-team-info {
  flex: 1;
  min-width: 0;
}

.settings-team-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
  display: flex;
  align-items: center;
  gap: 8px;
}

.st-pending-badge {
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--ka-warning-alpha);
  color: var(--ka-warning);
  font-size: 10px;
  font-weight: 600;
}

.settings-team-email {
  font-size: 12px;
  color: var(--ka-fg-3);
}

.st-role-select {
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-surface);
  font-size: 13px;
  color: var(--ka-fg);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.st-role-select:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 2px var(--ka-brand-alpha);
}

.st-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--ka-r-sm);
  background: transparent;
  color: var(--ka-fg-3);
  cursor: pointer;
  flex-shrink: 0;
}

.st-more-btn:hover {
  background: var(--ka-gray-100);
  color: var(--ka-fg);
}

.perm-table-wrap {
  overflow-x: auto;
}

.perm-table {
  width: 100%;
  border-collapse: collapse;
}

.perm-th-action {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px 12px 0;
}

.perm-th-role {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 16px 12px;
  min-width: 64px;
}

.perm-label {
  padding: 11px 12px 11px 0;
  font-size: 13px;
  color: var(--ka-fg-2);
  border-bottom: 1px solid var(--ka-border);
}

.perm-cell {
  text-align: center;
  padding: 11px 16px;
  border-bottom: 1px solid var(--ka-border);
}

.perm-check {
  color: var(--ka-success);
  font-size: 14px;
  font-weight: 700;
}

.perm-x {
  color: var(--ka-fg-3);
  font-size: 13px;
}

.perm-table tbody tr:last-child .perm-label,
.perm-table tbody tr:last-child .perm-cell {
  border-bottom: none;
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

.intg-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.intg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 680px) {
  .intg-grid { grid-template-columns: 1fr; }
}

.intg-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
}

.intg-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--ka-r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.intg-emoji {
  font-size: 20px;
  line-height: 1;
}

.intg-info {
  flex: 1;
  min-width: 0;
}

.intg-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
}

.intg-desc {
  font-size: 11px;
  color: var(--ka-fg-3);
  margin-top: 2px;
  line-height: 1.4;
}

.intg-connected-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 10px;
  background: var(--ka-success-alpha);
  color: var(--ka-success);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.intg-soon-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 10px;
  background: var(--ka-gray-100);
  color: var(--ka-fg-3);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
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

/* ── WhatsApp tab ───────────────────────────── */

.wa-conn-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.wa-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.wa-status-connected {
  background: var(--ka-success-alpha);
  color: var(--ka-success);
}

.wa-status-disconnected {
  background: var(--ka-danger-alpha);
  color: var(--ka-danger);
}

.wa-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.wa-instance-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-md);
  background: var(--ka-gray-50);
  margin-bottom: 20px;
}

.wa-wpp-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--ka-r-md);
  background: #25d366;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wa-instance-info {
  flex: 1;
  min-width: 0;
}

.wa-instance-phone {
  font-size: 15px;
  font-weight: 600;
  color: var(--ka-fg);
}

.wa-instance-meta {
  font-size: 11px;
  color: var(--ka-fg-3);
  margin-top: 2px;
}

.wa-disconnect-btn {
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ka-danger);
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--ka-r-sm);
}

.wa-disconnect-btn:hover {
  background: var(--ka-danger-alpha);
}

.wa-toggles {
  display: flex;
  flex-direction: column;
}

.wa-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--ka-border);
  gap: 16px;
}

.wa-toggle-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.wa-hours-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.wa-hours-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--ka-border);
}

.wa-hours-row:last-child {
  border-bottom: none;
}

.wa-hours-day {
  width: 72px;
  font-size: 14px;
  color: var(--ka-fg-2);
  flex-shrink: 0;
}

.wa-time-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-surface);
  font-size: 14px;
  color: var(--ka-fg);
  outline: none;
  width: 90px;
  flex-shrink: 0;
}

.wa-time-input:focus {
  border-color: var(--ka-brand);
  box-shadow: 0 0 0 2px var(--ka-brand-alpha);
}

.wa-time-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wa-hours-sep {
  font-size: 12px;
  color: var(--ka-fg-3);
  flex-shrink: 0;
}
</style>
