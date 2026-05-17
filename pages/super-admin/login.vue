<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: undefined })
const route = useRoute()
const redirect = route.query.redirect ? `?redirect=${encodeURIComponent(String(route.query.redirect))}` : ''
await navigateTo(`/login${redirect}`, { replace: true })
</script>
