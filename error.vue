<template>
  <div class="flex min-h-dvh items-center justify-center bg-[--ka-bg] p-4">
    <div class="text-center">
      <h1 class="font-display text-6xl font-bold text-[--ka-primary]">{{ error?.statusCode || 500 }}</h1>
      <p class="mb-8 mt-4 text-[--ka-fg-muted]">{{ error?.message || "Algo deu errado." }}</p>
      <NuxtLink to="/login" class="btn-primary">Voltar ao login</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const error = useError();
</script>
