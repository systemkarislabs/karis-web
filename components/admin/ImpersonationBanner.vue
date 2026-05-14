<template>
  <div v-if="auth.impersonation?.active" class="impersonation-banner">
    <div>
      <strong>Você está acessando {{ auth.company?.name || "uma empresa" }} como admin.</strong>
      <span> Sessão temporária iniciada por {{ auth.impersonation.by || "Super Admin" }}.</span>
    </div>
    <button type="button" @click="stop">Encerrar acesso</button>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore();

function stop() {
  if (import.meta.client) localStorage.removeItem("karis_impersonation_token");
  auth.clear();
  navigateTo("/super-admin");
}
</script>
