<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toast />
</template>

<script setup lang="ts">
import { useTheme } from "~/composables/useTheme";
useTheme().init();
</script>
