<template>
  <div class="intg-page">
    <div class="intg-header">
      <div>
        <p class="intg-eyebrow">Configurações</p>
        <h1 class="intg-title">Integrações</h1>
        <p class="intg-sub">Conecte canais e ferramentas externas à sua conta.</p>
      </div>
    </div>

    <div class="intg-grid">
      <!-- Instagram -->
      <div class="intg-card" :class="{ 'intg-card--connected': instagram.connected }">
        <div class="intg-card-header">
          <div class="intg-brand intg-brand--instagram">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <radialGradient id="ig" cx="30%" cy="107%" r="150%">
                <stop offset="0%" stop-color="#fdf497"/>
                <stop offset="5%" stop-color="#fdf497"/>
                <stop offset="45%" stop-color="#fd5949"/>
                <stop offset="60%" stop-color="#d6249f"/>
                <stop offset="90%" stop-color="#285AEB"/>
              </radialGradient>
              <rect width="24" height="24" rx="6" fill="url(#ig)"/>
              <path d="M12 8.25A3.75 3.75 0 1 0 12 15.75 3.75 3.75 0 0 0 12 8.25zm0 6.188A2.437 2.437 0 1 1 12 9.562a2.437 2.437 0 0 1 0 4.875zM16.594 7.219a.844.844 0 1 1-.001 1.687.844.844 0 0 1 0-1.688zM19.5 8.625A7.483 7.483 0 0 0 12 4.5 7.483 7.483 0 0 0 4.5 12a7.483 7.483 0 0 0 7.5 7.5 7.483 7.483 0 0 0 7.5-7.5V8.625zM18.188 15A6.188 6.188 0 0 1 12 18.188 6.188 6.188 0 0 1 5.813 12 6.188 6.188 0 0 1 12 5.813 6.188 6.188 0 0 1 18.188 12V15z" fill="white"/>
            </svg>
          </div>
          <div class="intg-card-info">
            <strong>Instagram</strong>
            <span>Direct Messages e comentários</span>
          </div>
          <span class="intg-status" :class="instagram.connected ? 'intg-status--on' : 'intg-status--off'">
            {{ instagram.connected ? 'Conectado' : 'Desconectado' }}
          </span>
        </div>

        <!-- Perfil conectado -->
        <div v-if="instagram.connected && instagram.profile" class="intg-profile">
          <img
            v-if="instagram.profile.profilePicture"
            :src="instagram.profile.profilePicture"
            :alt="instagram.profile.username"
            class="intg-profile-pic"
          />
          <div v-else class="intg-profile-pic intg-profile-pic--placeholder">
            <Icon name="users" :size="16" />
          </div>
          <div>
            <p class="intg-profile-name">@{{ instagram.profile.username }}</p>
            <p class="intg-profile-meta">{{ instagram.profile.name || 'Conta conectada' }}</p>
          </div>
        </div>

        <p v-else-if="!instagram.connected" class="intg-card-desc">
          Receba e responda mensagens diretas do Instagram dentro do Karis Atende.
        </p>

        <div class="intg-card-actions">
          <button
            v-if="!instagram.connected"
            class="btn primary sm"
            type="button"
            :disabled="instagram.loading"
            @click="connectInstagram"
          >
            <Icon name="link" :size="14" />
            {{ instagram.loading ? 'Conectando...' : 'Conectar Instagram' }}
          </button>
          <template v-else>
            <button
              class="btn secondary sm"
              type="button"
              :disabled="instagram.loading"
              @click="refreshInstagram"
            >
              <Icon name="refresh" :size="14" />
              Atualizar
            </button>
            <button
              class="btn sm intg-btn-disconnect"
              type="button"
              :disabled="instagram.loading"
              @click="disconnectInstagram"
            >
              <Icon name="logout" :size="14" />
              {{ instagram.loading ? 'Desconectando...' : 'Desconectar' }}
            </button>
          </template>
        </div>
      </div>

      <!-- Placeholder: mais integrações em breve -->
      <div class="intg-card intg-card--soon">
        <div class="intg-card-header">
          <div class="intg-brand intg-brand--fb">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <rect width="24" height="24" rx="6" fill="#1877F2"/>
              <path d="M16 8h-2a1 1 0 0 0-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 0 1 4-4h2v3z" fill="white"/>
            </svg>
          </div>
          <div class="intg-card-info">
            <strong>Facebook</strong>
            <span>Messenger e comentários</span>
          </div>
          <span class="intg-status intg-status--soon">Em breve</span>
        </div>
        <p class="intg-card-desc">Atenda pelo Messenger e gerencie comentários de posts.</p>
      </div>

      <div class="intg-card intg-card--soon">
        <div class="intg-card-header">
          <div class="intg-brand intg-brand--email">
            <Icon name="message" :size="18" color="white" />
          </div>
          <div class="intg-card-info">
            <strong>E-mail</strong>
            <span>Atendimento via e-mail</span>
          </div>
          <span class="intg-status intg-status--soon">Em breve</span>
        </div>
        <p class="intg-card-desc">Centralize e-mails de suporte junto às suas conversas.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { fetch: apiFetch } = useApi();
const toast = useToast();

const instagram = reactive({
  connected: false,
  loading: false,
  profile: null as null | { username: string; name?: string; profilePicture?: string },
});

async function loadInstagramStatus() {
  try {
    const data = await apiFetch<{ connected: boolean; username?: string; name?: string; profilePicture?: string }>(
      '/instagram/status'
    );
    instagram.connected = data.connected;
    instagram.profile = data.connected
      ? { username: data.username ?? '', name: data.name, profilePicture: data.profilePicture }
      : null;
  } catch {
    instagram.connected = false;
    instagram.profile = null;
  }
}

async function connectInstagram() {
  instagram.loading = true;
  try {
    const data = await apiFetch<{ oauthUrl: string }>('/instagram/connect', { method: 'POST' });
    if (data.oauthUrl) window.location.href = data.oauthUrl;
  } catch (err: any) {
    toast.error(err?.data?.message || 'Não foi possível iniciar a conexão com o Instagram.');
  } finally {
    instagram.loading = false;
  }
}

async function disconnectInstagram() {
  if (!confirm('Tem certeza que deseja desconectar o Instagram?')) return;
  instagram.loading = true;
  try {
    await apiFetch('/instagram/disconnect', { method: 'DELETE' });
    instagram.connected = false;
    instagram.profile = null;
    toast.success('Instagram desconectado com sucesso.');
  } catch (err: any) {
    toast.error(err?.data?.message || 'Não foi possível desconectar.');
  } finally {
    instagram.loading = false;
  }
}

async function refreshInstagram() {
  instagram.loading = true;
  await loadInstagramStatus();
  instagram.loading = false;
}

onMounted(loadInstagramStatus);
</script>

<style scoped>
.intg-page {
  padding: 24px 28px;
  max-width: 960px;
}

.intg-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ka-fg-muted);
  margin: 0;
}

.intg-title {
  font-family: var(--ka-font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 4px 0 4px;
}

.intg-sub {
  font-size: 13px;
  color: var(--ka-fg-2);
  margin: 0 0 28px;
}

.intg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* Card */
.intg-card {
  background: var(--ka-surface);
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 160ms, box-shadow 160ms;
}

.intg-card:not(.intg-card--soon):hover {
  border-color: var(--ka-brand);
  box-shadow: var(--ka-shadow-md);
}

.intg-card--connected {
  border-color: var(--ka-success);
}

.intg-card--soon {
  opacity: 0.55;
  pointer-events: none;
}

/* Card header */
.intg-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.intg-brand {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.intg-brand--instagram { background: transparent; }
.intg-brand--fb { background: #1877F2; }
.intg-brand--email { background: var(--ka-brand); }

.intg-card-info {
  flex: 1;
  min-width: 0;
}
.intg-card-info strong { display: block; font-size: 14px; font-weight: 700; color: var(--ka-fg); }
.intg-card-info span   { display: block; font-size: 11px; color: var(--ka-fg-muted); margin-top: 1px; }

/* Status pill */
.intg-status {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}
.intg-status--on   { background: var(--ka-success-bg); color: var(--ka-success); }
.intg-status--off  { background: var(--ka-danger-bg);  color: var(--ka-danger); }
.intg-status--soon { background: var(--ka-surface-2);  color: var(--ka-fg-muted); }

/* Profile row */
.intg-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--ka-surface-2);
  border-radius: var(--ka-r-md);
}

.intg-profile-pic {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.intg-profile-pic--placeholder {
  background: var(--ka-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ka-fg-muted);
}

.intg-profile-name { font-size: 13px; font-weight: 700; color: var(--ka-fg); margin: 0; }
.intg-profile-meta { font-size: 11px; color: var(--ka-fg-muted); margin: 0; }

.intg-card-desc {
  font-size: 13px;
  color: var(--ka-fg-2);
  margin: 0;
  line-height: 1.5;
}

/* Actions */
.intg-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.intg-btn-disconnect {
  background: transparent;
  border: 1px solid var(--ka-danger);
  color: var(--ka-danger);
}
.intg-btn-disconnect:hover:not(:disabled) {
  background: var(--ka-danger-bg);
}

@media (max-width: 600px) {
  .intg-page { padding: 16px; }
  .intg-grid { grid-template-columns: 1fr; }
}
</style>
