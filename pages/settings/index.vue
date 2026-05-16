<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <p class="page-eyebrow">Preferências</p>
        <h1 class="page-title">Configurações</h1>
        <p class="page-subtitle">Ajuste empresa, faturamento e canais da sua conta.</p>
      </div>
    </div>

    <div class="settings-layout">
      <nav class="settings-nav">
        <h6 class="settings-nav-label">Conta</h6>
        <button
          v-for="item in navItems"
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
          <div class="settings-card">
            <div class="settings-card-header">
              <div>
                <h3 class="settings-card-title">Dados da empresa</h3>
                <p class="settings-card-desc">Nome, segmento e informações de contato.</p>
              </div>
              <Button size="sm" :loading="savingBusiness" @click="saveBusiness">Salvar</Button>
            </div>
            <div v-if="loadingBusiness" class="settings-card-skeletons">
              <Skeleton v-for="i in 4" :key="i" height="40px" rounded="md" />
            </div>
            <div v-else class="settings-form-grid">
              <div class="form-group">
                <label class="form-label">Nome da empresa</label>
                <input v-model="business.name" class="form-input" placeholder="Karis Negócios" />
              </div>
              <div class="form-group">
                <label class="form-label">Segmento</label>
                <input v-model="business.segment" class="form-input" placeholder="E-commerce, Saúde, etc." />
              </div>
              <div class="form-group">
                <label class="form-label">Email de contato</label>
                <input v-model="business.email" class="form-input" type="email" placeholder="contato@empresa.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Telefone</label>
                <input v-model="business.phone" class="form-input" placeholder="+55 11 99999-9999" />
              </div>
              <div class="form-group-full">
                <label class="form-label">Site</label>
                <input v-model="business.website" class="form-input" placeholder="https://www.empresa.com.br" />
              </div>
              <div class="form-group-full">
                <label class="form-label">Descrição</label>
                <textarea v-model="business.description" class="form-textarea" placeholder="Descreva sua empresa em poucas palavras..." />
                <p class="form-hint">Usado pela IA para contextualizar as respostas.</p>
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

const navItems = [
  { key: "empresa",       label: "Empresa",           icon: "building" },
  { key: "usuarios",      label: "Usuários e times",  icon: "users" },
  { key: "whatsapp",      label: "WhatsApp",          icon: "whatsapp" },
  { key: "agente",        label: "Agente IA",         icon: "bot" },
  { key: "integracoes",   label: "Integrações",       icon: "zap" },
  { key: "notificacoes",  label: "Notificações",      icon: "bell" },
  { key: "cobranca",      label: "Cobrança",          icon: "card" },
  { key: "seguranca",     label: "Segurança",         icon: "shield" },
];

const loadingBusiness = ref(false);
const savingBusiness  = ref(false);
const business = reactive({ name: "", segment: "", email: "", phone: "", website: "", description: "" });

async function loadBusiness() {
  loadingBusiness.value = true;
  try {
    const res = await api.fetch<any>("/settings/business");
    Object.assign(business, res.business || res);
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


