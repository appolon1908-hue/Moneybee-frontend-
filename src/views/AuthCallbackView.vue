<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { userManager } from '../auth'
const router = useRouter(); const error = ref('')
onMounted(async () => { try { const user = await userManager.signinRedirectCallback(); const state = user.state as { returnTo?: string } | undefined; await router.replace(state?.returnTo || '/portal') } catch (e) { error.value = e instanceof Error ? e.message : 'Authentication failed' } })
</script>
<template><section class="panel"><h1>Signing you in…</h1><p v-if="error" class="error">{{ error }}</p></section></template>
