<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: undefined })
// A autenticação super admin é feita pela página de login principal
await navigateTo('/login', { replace: true })
</script>
