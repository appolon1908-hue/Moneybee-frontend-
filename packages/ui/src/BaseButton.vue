<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary"
    type?: "button" | "submit" | "reset"
    disabled?: boolean
  }>(),
  { variant: "primary", type: "button", disabled: false },
)

defineEmits<{ click: [MouseEvent] }>()
</script>

<template>
  <button
    :type="type"
    :class="{ secondary: variant === 'secondary' }"
    :disabled="disabled"
    @click="(event) => $emit('click', event)"
  >
    <slot />
  </button>
</template>
