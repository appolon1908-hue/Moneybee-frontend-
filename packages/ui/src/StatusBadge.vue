<script setup lang="ts">
import { computed } from "vue"
import { humanize } from "./format"
import { statusTone, type StatusTone } from "./status-tone"

const props = defineProps<{
  status: string
  /** Override the automatic tone lookup when a status needs a specific display color. */
  tone?: StatusTone
}>()

const tone = computed(() => props.tone ?? statusTone(props.status))
const label = computed(() => humanize(props.status))
</script>

<template>
  <span class="status-badge" :class="`tone-${tone}`">{{ label }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}
.tone-success { background: #e3f5ea; color: var(--green); }
.tone-warning { background: #fdf1dc; color: var(--amber); }
.tone-danger { background: #fbe6e6; color: var(--red); }
.tone-neutral { background: #eef1f5; color: var(--slate); }
</style>
