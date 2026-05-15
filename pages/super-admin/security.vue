<template>
  <section class="super-admin-page">
    <header class="super-admin-header">
      <div>
        <p class="eyebrow">Segurança</p>
        <h1>Acesso do Super Admin</h1>
        <p>2FA, auditoria, staff e restrições de impersonação.</p>
      </div>
    </header>

    <div class="super-admin-grid">
      <!-- Minha conta -->
      <section class="super-admin-panel">
        <h2>Minha conta</h2>
        <div class="stack-form">
          <h3>Alterar senha</h3>
          <label>Senha atual<input v-model="pwd.current" type="password" /></label>
          <label>Nova senha<input v-model="pwd.new" type="password" /></label>
          <p v-if="pwd.message" class="success-copy">{{ pwd.message }}</p>
          <p v-if="pwd.error" class="form-error">{{ pwd.error }}</p>
          <button class="primary-action" @click="changePassword" :disabled="pwd.loading">{{ pwd.loading ? "Salvando..." : "Alterar senha" }}</button>
        </div>

        <div class="stack-form" style="margin-top: 1.5rem;">
          <h3>Autenticação de dois fatores (2FA)</h3>
          <div v-if="!superAdmin.platformUser?.totpEnabled && !qrData.qrUrl">
            <p>Adicione uma camada extra de segurança ao seu login.</p>
            <button class="primary-action" @click="enable2FA" :disabled="qrData.loading">{{ qrData.loading ? "Gerando..." : "Ativar 2FA" }}</button>
          </div>
          <div v-if="qrData.qrUrl && !superAdmin.platformUser?.totpEnabled">
            <p>Escaneie o QR code com seu app autenticador (Google Authenticator, Authy, etc):</p>
            <img :src="qrData.qrUrl" alt="QR Code 2FA" style="width: 200px; height: 200px; margin: 1rem 0;" />
            <p class="muted">Códigos de recuperação (salve em local seguro):</p>
            <pre style="background: #f1f5f9; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; overflow-x: auto;">{{ qrData.recoveryCodes?.join("\n") }}</pre>
            <label>Digite o código de 6 dígitos para confirmar:
              <input v-model="qrData.code" type="text" maxlength="6" placeholder="000000" />
            </label>
            <button class="primary-action" @click="verify2FA" :disabled="qrData.loading">{{ qrData.loading ? "Verificando..." : "Confirmar ativação" }}</button>
          </div>
          <div v-if="superAdmin.platformUser?.totpEnabled">
            <p class="success-copy">2FA está ativo.</p>
            <label>Para desativar, digite um codigo atual:
              <input v-model="disableCode" type="text" maxlength="6" placeholder="000000" />
            </label>
            <button class="primary-action" @click="disable2FA" :disabled="disableLoading">{{ disableLoading ? "Desativando..." : "Desativar 2FA" }}</button>
          </div>
        </div>
      </section>

      <!-- Platform Users -->
      <section v-if="superAdmin.isSuperAdmin" class="super-admin-panel">
        <h2>Platform Users</h2>
        <div class="ops-table">
          <div v-for="u in platformUsers" :key="u.id" class="ops-row">
            <div>
              <strong>{{ u.name || u.email }}</strong>
              <span>{{ u.email }} — {{ u.role }}</span>
            </div>
            <span class="status-pill" :class="{ off: !u.totpEnabled }">{{ u.totpEnabled ? "2FA" : "Sem 2FA" }}</span>
            <button v-if="u.id !== superAdmin.platformUser?.id" type="button" @click="deleteUser(u.id)">Remover</button>
          </div>
        </div>

        <h3 style="margin-top: 1.5rem;">Criar STAFF</h3>
        <div class="stack-form">
          <label>Nome<input v-model="newUser.name" /></label>
          <label>E-mail<input v-model="newUser.email" type="email" /></label>
          <label>Senha<input v-model="newUser.password" type="password" /></label>
          <label>Role
            <select v-model="newUser.role">
              <option value="STAFF">STAFF</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </label>
          <p v-if="newUser.error" class="form-error">{{ newUser.error }}</p>
          <button class="primary-action" @click="createUser" :disabled="newUser.loading">{{ newUser.loading ? "Criando..." : "Criar usuário" }}</button>
        </div>
      </section>

      <!-- Sessoes -->
      <section class="super-admin-panel">
        <h2>Sessões</h2>
        <p>Encerrar todas as sessões invalida todos os tokens ativos.</p>
        <button class="primary-action" @click="logoutAll" :disabled="logoutLoading">{{ logoutLoading ? "Encerrando..." : "Encerrar todas as sessões" }}</button>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: "super-admin", middleware: "super-admin" });

const superAdmin = useSuperAdminStore();
const api = useAdminApi();

const pwd = reactive({ current: "", new: "", loading: false, message: "", error: "" });
const qrData = reactive({ qrUrl: "", secret: "", recoveryCodes: [] as string[], code: "", loading: false });
const disableCode = ref("");
const disableLoading = ref(false);
const logoutLoading = ref(false);

const platformUsers = ref<any[]>([]);
const newUser = reactive({ name: "", email: "", password: "", role: "STAFF", loading: false, error: "" });

async function loadUsers() {
  const data = await api.fetch<{ users: any[] }>("/platform-users");
  platformUsers.value = data.users;
}

async function changePassword() {
  pwd.loading = true; pwd.message = ""; pwd.error = "";
  try {
    await api.fetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.new }),
    });
    pwd.message = "Senha alterada com sucesso.";
    pwd.current = "";
    pwd.new = "";
  } catch (err: any) {
    pwd.error = err?.data?.message || "Erro ao alterar senha.";
  } finally { pwd.loading = false; }
}

async function enable2FA() {
  qrData.loading = true;
  try {
    const data = await api.fetch<{ qrUrl: string; secret: string; recoveryCodes: string[] }>("/auth/2fa/enable", { method: "POST" });
    qrData.qrUrl = data.qrUrl;
    qrData.secret = data.secret;
    qrData.recoveryCodes = data.recoveryCodes;
  } catch (err: any) {
    alert(err?.data?.message || "Erro ao ativar 2FA.");
  } finally { qrData.loading = false; }
}

async function verify2FA() {
  qrData.loading = true;
  try {
    await api.fetch("/auth/2fa/verify", { method: "POST", body: JSON.stringify({ code: qrData.code }) });
    qrData.qrUrl = "";
    qrData.code = "";
    await superAdmin.fetchMe();
    alert("2FA ativado com sucesso! Faça login novamente.");
  } catch (err: any) {
    alert(err?.data?.message || "Código inválido.");
  } finally { qrData.loading = false; }
}

async function disable2FA() {
  disableLoading.value = true;
  try {
    await api.fetch("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ code: disableCode.value }) });
    disableCode.value = "";
    await superAdmin.fetchMe();
    alert("2FA desativado.");
  } catch (err: any) {
    alert(err?.data?.message || "Código inválido.");
  } finally { disableLoading.value = false; }
}

async function logoutAll() {
  logoutLoading.value = true;
  try {
    await api.fetch("/auth/logout", { method: "POST" });
    superAdmin.clear();
    navigateTo("/login");
  } catch { logoutLoading.value = false; }
}

async function createUser() {
  newUser.loading = true; newUser.error = "";
  try {
    await api.fetch("/platform-users", {
      method: "POST",
      body: JSON.stringify({ name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role }),
    });
    newUser.name = ""; newUser.email = ""; newUser.password = ""; newUser.role = "STAFF";
    await loadUsers();
  } catch (err: any) {
    newUser.error = err?.data?.message || "Erro ao criar usuário.";
  } finally { newUser.loading = false; }
}

async function deleteUser(id: string) {
  if (!confirm("Tem certeza que deseja remover este usuário?")) return;
  try {
    await api.fetch(`/platform-users/${id}`, { method: "DELETE" });
    await loadUsers();
  } catch (err: any) {
    alert(err?.data?.message || "Erro ao remover usuário.");
  }
}

onMounted(loadUsers);
</script>
