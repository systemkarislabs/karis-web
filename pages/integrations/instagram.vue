<template>
  <div class="ig-callback">
    <div class="ig-callback-card">
      <!-- Ícone Instagram -->
      <div class="ig-logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
          <radialGradient id="igcb" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stop-color="#fdf497"/>
            <stop offset="5%" stop-color="#fdf497"/>
            <stop offset="45%" stop-color="#fd5949"/>
            <stop offset="60%" stop-color="#d6249f"/>
            <stop offset="90%" stop-color="#285AEB"/>
          </radialGradient>
          <rect width="24" height="24" rx="6" fill="url(#igcb)"/>
          <path d="M12 8.25A3.75 3.75 0 1 0 12 15.75 3.75 3.75 0 0 0 12 8.25zm0 6.188A2.437 2.437 0 1 1 12 9.562a2.437 2.437 0 0 1 0 4.875zM16.594 7.219a.844.844 0 1 1-.001 1.687.844.844 0 0 1 0-1.688zM19.5 8.625A7.483 7.483 0 0 0 12 4.5 7.483 7.483 0 0 0 4.5 12a7.483 7.483 0 0 0 7.5 7.5 7.483 7.483 0 0 0 7.5-7.5V8.625zM18.188 15A6.188 6.188 0 0 1 12 18.188 6.188 6.188 0 0 1 5.813 12 6.188 6.188 0 0 1 12 5.813 6.188 6.188 0 0 1 18.188 12V15z" fill="white"/>
        </svg>
      </div>

      <!-- Sucesso -->
      <template v-if="status === 'success'">
        <div class="ig-icon-wrap ig-icon-wrap--success">
          <Icon name="check" :size="24" />
        </div>
        <h1>Instagram conectado!</h1>
        <p>Sua conta <strong v-if="username">@{{ username }}</strong><span v-else>do Instagram</span> foi vinculada com sucesso. Mensagens diretas aparecerão no inbox do Karis Atende.</p>
        <button class="btn primary" type="button" @click="navigateTo('/integrations')">
          Ver integrações
        </button>
      </template>

      <!-- Erro -->
      <template v-else-if="status === 'error'">
        <div class="ig-icon-wrap ig-icon-wrap--error">
          <Icon name="alert" :size="24" />
        </div>
        <h1>Conexão falhou</h1>
        <p>{{ errorMessage }}</p>
        <div class="ig-actions">
          <button class="btn primary" type="button" @click="tryAgain">Tentar novamente</button>
          <button class="btn secondary" type="button" @click="navigateTo('/integrations')">Cancelar</button>
        </div>
      </template>

      <!-- Carregando (sem query params ainda) -->
      <template v-else>
        <div class="ig-icon-wrap ig-icon-wrap--loading">
          <Icon name="loader" :size="24" class="spin" />
        </div>
        <h1>Conectando...</h1>
        <p>Aguarde enquanto validamos sua autorização com o Instagram.</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' });

const route = useRoute();

const status = computed<'success' | 'error' | 'loading'>(() => {
  if (route.query.success === '1') return 'success';
  if (route.query.error)           return 'error';
  return 'loading';
});

const username = computed(() =>
  typeof route.query.username === 'string' ? route.query.username : ''
);

const errorMessage = computed(() => {
  const err = route.query.error;
  if (!err) return 'Não foi possível concluir a conexão com o Instagram.';
  const messages: Record<string, string> = {
    access_denied:    'Você negou o acesso. Para conectar, autorize o Karis Atende no Instagram.',
    invalid_token:    'Token inválido ou expirado. Tente novamente.',
    already_connected: 'Esta conta do Instagram já está conectada.',
  };
  return messages[String(err)] ?? `Erro: ${err}`;
});

function tryAgain() {
  navigateTo('/integrations');
}
</script>

<style scoped>
.ig-callback {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--ka-bg);
}

.ig-callback-card {
  background: var(--ka-surface);
  border: 1px solid var(--ka-border);
  border-radius: var(--ka-r-xl);
  box-shadow: var(--ka-shadow-lg);
  padding: 40px 36px;
  width: min(440px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.ig-logo {
  margin-bottom: 4px;
}

.ig-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ig-icon-wrap--success { background: var(--ka-success-bg); color: var(--ka-success); }
.ig-icon-wrap--error   { background: var(--ka-danger-bg);  color: var(--ka-danger); }
.ig-icon-wrap--loading { background: var(--ka-brand-50);   color: var(--ka-brand); }

h1 {
  font-family: var(--ka-font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--ka-fg);
  margin: 0;
}

p {
  font-size: 14px;
  color: var(--ka-fg-2);
  line-height: 1.55;
  margin: 0;
}

.ig-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.ig-actions .btn { flex: 1; min-width: 120px; }

.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
