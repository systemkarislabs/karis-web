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
              <button class="btn primary" type="button" :disabled="savingBusiness" @click="saveBusiness">
                {{ savingBusiness ? 'Salvando…' : 'Salvar' }}
              </button>
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
              <button class="btn primary" type="button" @click="inviteUser">
                <Icon name="plus" :size="16" />
                Convidar
              </button>
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
                <div class="wa-instance-phone">{{ waPhone || (loadingWa ? 'Carregando…' : 'Não conectado') }}</div>
                <div class="wa-instance-meta">Instance: {{ waWabaId || '—' }} · {{ waConnectedSince || '—' }}</div>
              </div>
              <button class="btn secondary" type="button" @click="reconnectWa">
                <Icon name="refresh" :size="14" />
                Reconectar
              </button>
              <button class="btn ghost" type="button" style="color:var(--ka-danger);" @click="disconnectWa">Desconectar</button>
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
              <button class="btn primary" type="button" :disabled="savingHours" @click="saveBusinessHours">
                {{ savingHours ? 'Salvando…' : 'Salvar' }}
              </button>
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
            <div class="notif-card-header">
              <div>
                <h3 class="settings-card-title">Como você quer ser avisado?</h3>
                <p class="settings-card-desc">Você pode pausar tudo durante o horário comercial fechado.</p>
              </div>
            </div>

            <div class="notif-table">
              <!-- column headers -->
              <div class="notif-col-headers">
                <span class="notif-col-label">App</span>
                <span class="notif-col-label">Email</span>
                <span class="notif-col-label">Push</span>
              </div>

              <template v-for="group in notifGroups" :key="group.key">
                <div class="notif-group-label">{{ group.label }}</div>
                <div v-for="n in group.items" :key="n.key" class="notif-row">
                  <span class="notif-row-label">{{ n.label }}</span>
                  <div v-for="ch in ['app','email','push']" :key="ch" class="notif-cell">
                    <button
                      class="settings-toggle"
                      :class="{ 'settings-toggle-on': n[ch] }"
                      type="button"
                      @click="n[ch] = !n[ch]"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'cobranca'">
          <!-- Uso atual -->
          <div class="settings-card">
            <div class="settings-card-header" style="margin-bottom: 18px;">
              <div>
                <h3 class="settings-card-title">Uso do plano</h3>
                <p class="settings-card-desc">Consumo acumulado da sua conta Karis.</p>
              </div>
              <span v-if="loadingBilling" class="billing-loading-badge">Carregando…</span>
            </div>
            <div class="billing-usage-grid">
              <div class="billing-usage-item">
                <div class="billing-usage-value">{{ conversasUsed.toLocaleString('pt-BR') }}</div>
                <div class="billing-usage-label">Conversas totais</div>
              </div>
              <div class="billing-usage-item">
                <div class="billing-usage-value">{{ usersUsed }}</div>
                <div class="billing-usage-label">Usuários ativos</div>
              </div>
            </div>
          </div>

          <!-- Gerenciar plano -->
          <div class="settings-card billing-manage-card">
            <div class="billing-manage-icon">
              <Icon name="card" :size="28" />
            </div>
            <div class="billing-manage-body">
              <h3 class="billing-manage-title">Gerencie seu plano</h3>
              <p class="billing-manage-desc">Upgrade, cancelamento, faturas e forma de pagamento são gerenciados pelo nosso time. Entre em contato para qualquer alteração.</p>
              <div class="billing-manage-actions">
                <a class="btn primary" href="https://wa.me/554196019000" target="_blank" rel="noopener">
                  <Icon name="message" :size="14" />
                  Falar com o suporte
                </a>
                <a class="btn secondary" href="mailto:suporte@karisnegocios.com.br">
                  <Icon name="mail" :size="14" />
                  suporte@karisnegocios.com.br
                </a>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeSection === 'seguranca'">
          <!-- Segurança da conta -->
          <div class="settings-card">
            <div class="settings-card-header" style="margin-bottom: 4px;">
              <div>
                <h3 class="settings-card-title">Segurança da conta</h3>
                <p class="settings-card-desc">Recomendamos ativar o 2FA para administradores.</p>
              </div>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Autenticação em 2 fatores</div>
                <div class="settings-switch-desc">Pede um código no app autenticador a cada login.</div>
              </div>
              <button class="settings-toggle" :class="{ 'settings-toggle-on': sec.twofa }" type="button" @click="sec.twofa = !sec.twofa" />
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Login só por convite</div>
                <div class="settings-switch-desc">Bloqueia auto-cadastro mesmo com email da empresa.</div>
              </div>
              <button class="settings-toggle" :class="{ 'settings-toggle-on': sec.inviteOnly }" type="button" @click="sec.inviteOnly = !sec.inviteOnly" />
            </div>
            <div class="settings-switch-row" style="border-bottom: none;">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Sessões automáticas</div>
                <div class="settings-switch-desc">Encerra sessão após 12h de inatividade.</div>
              </div>
              <button class="settings-toggle" :class="{ 'settings-toggle-on': sec.autoLogout }" type="button" @click="sec.autoLogout = !sec.autoLogout" />
            </div>
          </div>

          <!-- Dispositivos conectados -->
          <div class="settings-card">
            <div class="sec-devices-header">
              <div>
                <h3 class="settings-card-title">Dispositivos conectados</h3>
                <p class="settings-card-desc">{{ devices.length }} dispositivo{{ devices.length !== 1 ? 's' : '' }} ativo{{ devices.length !== 1 ? 's' : '' }} · Encerre se não reconhecer algum.</p>
              </div>
              <button class="sec-danger-link" type="button" @click="revokeOtherSessions">Encerrar outras</button>
            </div>
            <div class="sec-devices-list">
              <div v-for="dev in devices" :key="dev.id" class="sec-device-row">
                <div class="sec-device-icon">{{ dev.icon }}</div>
                <div class="sec-device-info">
                  <div class="sec-device-name">
                    {{ dev.name }}
                    <span v-if="dev.current" class="sec-current-badge">Esta sessão</span>
                  </div>
                  <div class="sec-device-meta">{{ dev.location }} · {{ dev.time }}</div>
                </div>
                <button v-if="!dev.current" class="sec-revoke-btn" type="button" @click="revokeDevice(dev.id)">Encerrar</button>
              </div>
            </div>
          </div>

          <!-- Zona de perigo -->
          <div class="settings-card sec-danger-card">
            <h3 class="sec-danger-title">Zona de perigo</h3>
            <p class="sec-danger-subtitle">Ações irreversíveis. Pense duas vezes antes.</p>
            <div class="settings-switch-row">
              <div class="settings-switch-text">
                <div class="settings-switch-title">Exportar todos os dados</div>
                <div class="settings-switch-desc">ZIP com conversas, contatos e configurações.</div>
              </div>
              <button class="sec-export-btn" type="button" @click="exportData">
                <Icon name="download" :size="14" />Exportar
              </button>
            </div>
            <div class="settings-switch-row" style="border-bottom: none;">
              <div class="settings-switch-text">
                <div class="settings-switch-title" style="color: var(--ka-danger);">Excluir conta</div>
                <div class="settings-switch-desc">Apaga toda a empresa. Não tem volta.</div>
              </div>
              <button class="sec-delete-btn" type="button" @click="deleteAccount">Excluir</button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const api   = useApi();
const toast = useToast();

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
    const res = await api.fetch<any>("/companies/me");
    const c = res.company || res;
    if (c.name) business.tradeName = c.name;
    if (c.logoUrl) logoPreview.value = c.logoUrl;
  } catch { /* silently ignore */ } finally {
    loadingBusiness.value = false;
  }
}

async function saveBusiness() {
  savingBusiness.value = true;
  try {
    await api.fetch("/companies/me", {
      method: "PATCH",
      body: JSON.stringify({ name: business.tradeName || business.legalName }),
    });
    toast.success("Empresa atualizada com sucesso.");
  } catch {
    toast.error("Não foi possível salvar. Tente novamente.");
  } finally {
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
    const res = await api.fetch<any>("/users/");
    team.value = res.users || res || [];
  } catch { team.value = []; } finally {
    loadingTeam.value = false;
  }
}

async function inviteUser() {
  toast.info("Convite por e-mail disponível em breve.");
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
const waConnected      = ref(false);
const waPhone          = ref("");
const waWabaId         = ref("");
const waConnectedSince = ref("");
const loadingWa        = ref(false);

function connectedSinceLabel(updatedAt?: string): string {
  if (!updatedAt) return "—";
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000);
  if (days === 0) return "conectado hoje";
  if (days === 1) return "conectado há 1 dia";
  return `conectado há ${days} dias`;
}

async function loadWaStatus() {
  loadingWa.value = true;
  try {
    const res = await api.fetch<any>("/whatsapp/status");
    waConnected.value = res.status === "CONNECTED";
    waPhone.value          = res.connection?.phoneNumber || "—";
    waWabaId.value         = res.connection?.evolutionInstanceName || "—";
    waConnectedSince.value = connectedSinceLabel(res.connection?.updatedAt);
  } catch {
    waConnected.value = false;
  } finally {
    loadingWa.value = false;
  }
}

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
    toast.success("Horário comercial salvo.");
  } catch {
    toast.info("Horário salvo localmente — sincronização com servidor em breve.");
  } finally {
    savingHours.value = false;
  }
}

async function reconnectWa() {
  try {
    await api.fetch("/whatsapp/connect", { method: "POST" });
    toast.success("Reconectando… aguarde alguns segundos.");
    setTimeout(loadWaStatus, 4000);
  } catch { toast.error("Não foi possível reconectar."); }
}

async function disconnectWa() {
  try {
    await api.fetch("/whatsapp/disconnect", { method: "DELETE" });
    waConnected.value = false;
    waPhone.value = "—";
    waConnectedSince.value = "—";
    toast.success("WhatsApp desconectado com sucesso.");
  } catch { toast.error("Não foi possível desconectar."); }
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

const notifGroups = reactive([
  {
    key: "conversas", label: "Conversas",
    items: [
      { key: "nova_conversa",  label: "Nova conversa aberta",           app: true,  email: true,  push: false },
      { key: "aguardando",     label: "Cliente esperando há mais de 5 min", app: true,  email: true,  push: true  },
      { key: "revisao_ia",     label: "IA precisa de revisão humana",   app: true,  email: false, push: true  },
    ],
  },
  {
    key: "crm", label: "CRM",
    items: [
      { key: "lead_nova",      label: "Lead nova no pipeline",          app: true,  email: true,  push: false },
      { key: "negocio_ganho",  label: "Negócio fechado (ganho)",        app: true,  email: true,  push: false },
      { key: "negocio_perdido",label: "Negócio perdido",                app: false, email: true,  push: false },
    ],
  },
  {
    key: "time", label: "Time",
    items: [
      { key: "mencao",         label: "Mencionaram você (@mention)",    app: true,  email: true,  push: true  },
      { key: "resposta",       label: "Resposta à sua conversa",        app: true,  email: true,  push: false },
    ],
  },
]);

// Segurança
const sec = reactive({ twofa: false, inviteOnly: false, autoLogout: false });

const devices = ref<any[]>([]);

async function revokeDevice(id: string) {
  devices.value = devices.value.filter((d: any) => d.id !== id);
  try { await api.fetch(`/auth/sessions/${id}`, { method: "DELETE" }); } catch { /* endpoint pending */ }
}

async function revokeOtherSessions() {
  devices.value = devices.value.filter((d: any) => d.current);
  try { await api.fetch("/auth/sessions/others", { method: "DELETE" }); } catch { /* endpoint pending */ }
}

async function exportData() {
  toast.info("Exportação de dados disponível em breve.");
}

async function deleteAccount() {
  toast.error("Para excluir a conta, entre em contato com o suporte.");
}

const planName       = ref("");
const planPrice      = ref("");
const cardLast4      = ref("");
const cardHolder     = ref("");
const cardExpiry     = ref("");
const conversasUsed  = ref(0);
const conversasLimit = ref(0);
const usersUsed      = ref(0);
const usersLimit     = ref(0);
const loadingBilling = ref(false);

const invoices = ref<any[]>([]);

async function loadBilling() {
  loadingBilling.value = true;
  try {
    const res = await api.fetch<any>("/companies/me");
    const sub = res.company?.subscription;
    if (sub) {
      planName.value  = sub.plan?.name || "—";
      planPrice.value = sub.plan?.price ? `R$ ${(sub.plan.price / 100).toFixed(0)}/mês` : "—";
    }
    const counts = res.company?._count;
    if (counts) {
      usersUsed.value = counts.users ?? 0;
      conversasUsed.value = counts.conversations ?? 0;
    }
    const entitlements = res.company?.entitlements;
    if (entitlements?.limits) {
      usersLimit.value      = entitlements.limits.users ?? 10;
      conversasLimit.value  = entitlements.limits.conversations ?? 5000;
    }
  } catch { /* billing endpoint optional */ } finally {
    loadingBilling.value = false;
  }
}

watch(activeSection, (section) => {
  if (section === "empresa")    loadBusiness();
  if (section === "usuarios")   loadTeam();
  if (section === "whatsapp")   loadWaStatus();
  if (section === "cobranca")   loadBilling();
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
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: var(--ka-surface);
  font-size: 14px;
  color: var(--ka-fg);
  font-family: inherit;
  outline: none;
  resize: vertical;
  min-height: 96px;
  box-sizing: border-box;
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

/* ── Cobrança tab ─────────────────────────── */

.billing-loading-badge {
  font-size: 11px;
  color: var(--ka-fg-muted);
  background: var(--ka-gray-100);
  padding: 3px 10px;
  border-radius: 999px;
}

.billing-usage-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.billing-usage-item {
  background: var(--ka-gray-50);
  border: 1px solid var(--ka-border);
  border-radius: 10px;
  padding: 16px 18px;
}

.billing-usage-value {
  font-family: var(--ka-font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--ka-fg);
  letter-spacing: -0.02em;
  line-height: 1;
}

.billing-usage-label {
  font-size: 12px;
  color: var(--ka-fg-muted);
  margin-top: 6px;
}

.billing-manage-card {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.billing-manage-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--ka-brand-50);
  color: var(--ka-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.billing-manage-body {
  flex: 1;
  min-width: 0;
}

.billing-manage-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ka-fg);
  margin: 0 0 6px;
}

.billing-manage-desc {
  font-size: 13px;
  color: var(--ka-fg-2);
  line-height: 1.55;
  margin: 0 0 16px;
}

.billing-manage-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Segurança tab ────────────────────────── */

.sec-devices-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sec-danger-link {
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ka-danger);
  cursor: pointer;
  padding: 4px 0;
  flex-shrink: 0;
}

.sec-danger-link:hover {
  text-decoration: underline;
}

.sec-devices-list {
  display: flex;
  flex-direction: column;
}

.sec-device-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--ka-border);
}

.sec-device-row:last-child {
  border-bottom: none;
}

.sec-device-icon {
  font-size: 20px;
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.sec-device-info {
  flex: 1;
  min-width: 0;
}

.sec-device-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ka-fg);
  display: flex;
  align-items: center;
  gap: 8px;
}

.sec-current-badge {
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--ka-success-alpha);
  color: var(--ka-success);
  font-size: 10px;
  font-weight: 600;
}

.sec-device-meta {
  font-size: 12px;
  color: var(--ka-fg-3);
  margin-top: 2px;
}

.sec-revoke-btn {
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ka-danger);
  cursor: pointer;
  padding: 5px 10px;
  border-radius: var(--ka-r-sm);
  flex-shrink: 0;
}

.sec-revoke-btn:hover {
  background: var(--ka-danger-alpha);
}

.sec-danger-card {
  border-color: var(--ka-danger);
}

.sec-danger-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ka-danger);
  margin: 0 0 4px;
}

.sec-danger-subtitle {
  font-size: 13px;
  color: var(--ka-fg-3);
  margin: 0 0 16px;
}

.sec-export-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-sm);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ka-fg-2);
  cursor: pointer;
  flex-shrink: 0;
}

.sec-export-btn:hover {
  background: var(--ka-gray-50);
}

.sec-delete-btn {
  padding: 6px 14px;
  border: 1px solid var(--ka-danger);
  border-radius: var(--ka-r-sm);
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--ka-danger);
  cursor: pointer;
  flex-shrink: 0;
}

.sec-delete-btn:hover {
  background: var(--ka-danger-alpha);
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

/* ── Notificações tab ─────────────────────── */

.notif-card-header {
  margin-bottom: 20px;
}

.notif-table {
  display: flex;
  flex-direction: column;
}

.notif-col-headers {
  display: flex;
  justify-content: flex-end;
  gap: 0;
  padding: 0 0 8px;
  border-bottom: 1px solid var(--ka-border);
}

.notif-col-label {
  width: 64px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--ka-fg-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.notif-group-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--ka-brand);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px 0 6px;
}

.notif-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--ka-border);
  gap: 0;
}

.notif-row:last-child {
  border-bottom: none;
}

.notif-row-label {
  flex: 1;
  font-size: 13px;
  color: var(--ka-fg-2);
}

.notif-cell {
  flex: 0 0 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
