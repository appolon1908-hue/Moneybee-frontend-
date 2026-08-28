<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <section class="card">
    <h3 v-if="title">{{ title }}</h3>
    <slot />
  </section>
</template>
