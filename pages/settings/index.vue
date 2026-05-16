<template>
  <NuxtLayout name="default">
    <div class="ka-page">
      <div class="contacts-v2-header" style="margin-bottom: 24px;">
        <div>
          <p class="dashboard-eyebrow">Preferências</p>
          <h1 style="font-family: var(--ka-font-display); font-size: 26px; font-weight: 700; letter-spacing: -0.01em; color: var(--ka-fg); margin: 2px 0 4px;">
            Configurações
          </h1>
          <p style="font-size: 14px; color: var(--ka-fg-muted);">Ajuste empresa, faturamento e canais da sua conta.</p>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Sub-nav -->
        <nav class="settings-nav">
          <h6>Conta</h6>
          <button
            v-for="item in navItems"
            :key="item.key"
            class="item"
            :class="{ active: activeSection === item.key }"
            type="button"
            @click="activeSection = item.key"
          >
            <component :is="item.icon" class="h-4 w-4" style="flex-shrink: 0;" />
            {{ item.label }}
          </button>
        </nav>

        <!-- Content -->
        <div class="settings-section">

          <!-- ── Empresa ── -->
          <template v-if="activeSection === 'empresa'">
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Dados da empresa</h3>
                  <p class="sub">Nome, segmento e informações de contato.</p>
                </div>
                <Button size="sm" :loading="savingBusiness" @click="saveBusiness">Salvar</Button>
              </div>
              <div v-if="loadingBusiness" class="space-y-3">
                <Skeleton v-for="i in 4" :key="i" height="2.5rem" />
              </div>
              <div v-else class="form-grid">
                <div>
                  <label>Nome da empresa</label>
                  <input v-model="business.name" class="input-field" placeholder="Karis Negócios" />
                </div>
                <div>
                  <label>Segmento</label>
                  <input v-model="business.segment" class="input-field" placeholder="E-commerce, Saúde, etc." />
                </div>
                <div>
                  <label>Email de contato</label>
                  <input v-model="business.email" class="input-field" type="email" placeholder="contato@empresa.com" />
                </div>
                <div>
                  <label>Telefone</label>
                  <input v-model="business.phone" class="input-field" placeholder="+55 11 99999-9999" />
                </div>
                <div class="full">
                  <label>Site</label>
                  <input v-model="business.website" class="input-field" placeholder="https://www.empresa.com.br" />
                </div>
                <div class="full">
                  <label>Descrição</label>
                  <textarea v-model="business.description" placeholder="Descreva sua empresa em poucas palavras..." />
                  <p class="hint">Usado pela IA para contextualizar as respostas.</p>
                </div>
              </div>
            </div>
          </template>

          <!-- ── Usuários e times ── -->
          <template v-if="activeSection === 'usuarios'">
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Membros da equipe</h3>
                  <p class="sub">Gerencie quem tem acesso à plataforma.</p>
                </div>
                <Button size="sm">
                  <Plus class="h-4 w-4" />
                  Convidar
                </Button>
              </div>
              <div v-if="loadingTeam" class="space-y-3">
                <Skeleton v-for="i in 3" :key="i" height="3rem" />
              </div>
              <div v-else>
                <div v-for="member in team" :key="member.id" class="team-row">
                  <Avatar :name="member.name || member.email" size="sm" />
                  <div class="tr-info">
                    <div class="tr-name">{{ member.name || "Sem nome" }}</div>
                    <div class="tr-email">{{ member.email }}</div>
                  </div>
                  <Badge :variant="member.role === 'ADMIN' ? 'default' : 'neutral'" size="sm">
                    {{ member.role === "ADMIN" ? "Admin" : "Agente" }}
                  </Badge>
                </div>
                <EmptyState v-if="!team.length" title="Nenhum membro" description="Convide colaboradores para acessar a plataforma." />
              </div>
            </div>
          </template>

          <!-- ── WhatsApp ── -->
          <template v-if="activeSection === 'whatsapp'">
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Canal WhatsApp</h3>
                  <p class="sub">Status da instância, QR Code e diagnóstico.</p>
                </div>
                <Button size="sm" @click="navigateTo('/whatsapp')">
                  Gerenciar canal
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Instância conectada</div>
                  <div class="sw-desc">Gerencie a conexão e reconexão com o WhatsApp na página dedicada.</div>
                </div>
                <Button variant="secondary" size="sm" @click="navigateTo('/whatsapp')">Abrir</Button>
              </div>
            </div>
          </template>

          <!-- ── Agente IA ── -->
          <template v-if="activeSection === 'agente'">
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Configurações da IA</h3>
                  <p class="sub">Personalidade, setores e base de conhecimento.</p>
                </div>
                <Button size="sm" @click="navigateTo('/agent')">
                  Ir para Agente IA
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">IA habilitada</div>
                  <div class="sw-desc">Quando ativa, a Karis responde automaticamente às mensagens dos clientes.</div>
                </div>
                <button class="toggle" :class="{ on: aiEnabled }" type="button" @click="aiEnabled = !aiEnabled" />
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Transferência automática</div>
                  <div class="sw-desc">Encaminha para humano quando a IA não tem resposta adequada.</div>
                </div>
                <button class="toggle" :class="{ on: autoTransfer }" type="button" @click="autoTransfer = !autoTransfer" />
              </div>
            </div>
          </template>

          <!-- ── Integrações ── -->
          <template v-if="activeSection === 'integracoes'">
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Integrações</h3>
                  <p class="sub">Conecte ferramentas externas à plataforma.</p>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div v-for="intg in integrations" :key="intg.name" class="integration-row">
                  <div class="logo">{{ intg.emoji }}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div class="int-nm">{{ intg.name }}</div>
                    <div class="int-desc">{{ intg.desc }}</div>
                  </div>
                  <Button :variant="intg.connected ? 'success' : 'secondary'" size="sm">
                    {{ intg.connected ? "Conectado" : "Conectar" }}
                  </Button>
                </div>
              </div>
            </div>
          </template>

          <!-- ── Notificações ── -->
          <template v-if="activeSection === 'notificacoes'">
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Notificações</h3>
                  <p class="sub">Escolha quando e como receber alertas.</p>
                </div>
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Nova mensagem recebida</div>
                  <div class="sw-desc">Notificação quando um cliente enviar mensagem.</div>
                </div>
                <button class="toggle on" type="button" />
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Transferência para humano</div>
                  <div class="sw-desc">Alerta quando a IA redirecionar para atendimento humano.</div>
                </div>
                <button class="toggle on" type="button" />
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Resumo diário</div>
                  <div class="sw-desc">Receba um resumo por email todo dia às 18h.</div>
                </div>
                <button class="toggle" type="button" />
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Relatório semanal</div>
                  <div class="sw-desc">Receba métricas semanais de atendimento por email.</div>
                </div>
                <button class="toggle" type="button" />
              </div>
            </div>
          </template>

          <!-- ── Cobrança ── -->
          <template v-if="activeSection === 'cobranca'">
            <div class="plan-card">
              <span class="badge-pill">Plano atual</span>
              <div class="pc-name">{{ planName }}</div>
              <div class="pc-price">{{ planPrice }}</div>
              <div class="pc-usage">
                <div style="flex: 1;">
                  <div class="pc-usage-label">Conversas usadas este mês</div>
                  <div class="progress" style="margin-top: 8px;">
                    <div :style="{ width: `${usagePct}%` }" />
                  </div>
                </div>
                <span style="font-weight: 700; font-size: 15px;">{{ usagePct }}%</span>
              </div>
            </div>
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Faturamento</h3>
                  <p class="sub">Histórico de cobranças e método de pagamento.</p>
                </div>
                <Button variant="secondary" size="sm">Gerenciar assinatura</Button>
              </div>
              <EmptyState title="Sem cobranças registradas" description="Seu histórico de pagamentos aparecerá aqui." />
            </div>
          </template>

          <!-- ── Segurança ── -->
          <template v-if="activeSection === 'seguranca'">
            <div class="settings-card">
              <div class="title-row">
                <div>
                  <h3>Segurança</h3>
                  <p class="sub">Senha, sessões ativas e autenticação de dois fatores.</p>
                </div>
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Autenticação de dois fatores (2FA)</div>
                  <div class="sw-desc">Adiciona uma camada extra de segurança ao login.</div>
                </div>
                <Button variant="secondary" size="sm">Configurar</Button>
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Alterar senha</div>
                  <div class="sw-desc">Última alteração: desconhecida.</div>
                </div>
                <Button variant="secondary" size="sm">Alterar</Button>
              </div>
              <div class="switch-row">
                <div class="sw-text">
                  <div class="sw-title">Sessões ativas</div>
                  <div class="sw-desc">Encerrar todos os outros dispositivos conectados.</div>
                </div>
                <Button variant="secondary" size="sm" style="color: var(--ka-danger);">Encerrar sessões</Button>
              </div>
            </div>
          </template>

        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Bell, Bot, Building2, ChevronRight, CreditCard, MessageCircle, Plus, Shield, Users, Zap } from "lucide-vue-next";

definePageMeta({ layout: false, middleware: "auth" });

const api = useApi();

const activeSection = ref("empresa");

const navItems = [
  { key: "empresa",       label: "Empresa",           icon: Building2 },
  { key: "usuarios",      label: "Usuários e times",  icon: Users },
  { key: "whatsapp",      label: "WhatsApp",          icon: MessageCircle },
  { key: "agente",        label: "Agente IA",         icon: Bot },
  { key: "integracoes",   label: "Integrações",       icon: Zap },
  { key: "notificacoes",  label: "Notificações",      icon: Bell },
  { key: "cobranca",      label: "Cobrança",          icon: CreditCard },
  { key: "seguranca",     label: "Segurança",         icon: Shield },
];

// ── Empresa ──────────────────────────────────────────
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

// ── Usuários ──────────────────────────────────────────
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

// ── Agente IA ─────────────────────────────────────────
const aiEnabled    = ref(true);
const autoTransfer = ref(true);

// ── Integrações ───────────────────────────────────────
const integrations = [
  { name: "Zapier",      emoji: "⚡", desc: "Automatize fluxos com mais de 5.000 apps.",  connected: false },
  { name: "Google Sheets", emoji: "📊", desc: "Sincronize contatos e leads com planilhas.", connected: false },
  { name: "HubSpot",    emoji: "🔶", desc: "Sincronize contatos e deals com o CRM.",       connected: false },
  { name: "Webhook",    emoji: "🔗", desc: "Envie eventos para qualquer endpoint HTTP.",    connected: false },
];

// ── Cobrança ──────────────────────────────────────────
const planName  = ref("Profissional");
const planPrice = ref("R$ 297/mês");
const usagePct  = ref(42);

// ── Init ──────────────────────────────────────────────
watch(activeSection, (section) => {
  if (section === "empresa" && !business.name) loadBusiness();
  if (section === "usuarios" && !team.value.length) loadTeam();
}, { immediate: true });
</script>
