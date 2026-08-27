<script setup lang="ts">
withDefaults(defineProps<{
  href?: string
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
})
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : type"
    :disabled="href ? undefined : disabled"
    class="mb-button"
    :class="`mb-button--${variant}`"
  >
    <span><slot /></span>
  </component>
</template>

<style scoped>
.mb-button {
  min-height: var(--mb-control-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--mb-space-6);
  border: 1px solid transparent;
  border-radius: var(--mb-radius-sm);
  cursor: pointer;
  font-size: var(--mb-text-xs);
  font-weight: var(--mb-weight-semibold);
  letter-spacing: var(--mb-tracking-wide);
  line-height: 1;
  text-transform: uppercase;
  transition:
    background-color var(--mb-motion-fast) var(--mb-ease),
    border-color var(--mb-motion-fast) var(--mb-ease),
    color var(--mb-motion-fast) var(--mb-ease),
    transform var(--mb-motion-fast) var(--mb-ease);
}

.mb-button:hover {
  transform: translateY(-1px);
}

.mb-button:active {
  transform: translateY(0);
}

.mb-button--primary {
  background: var(--mb-color-accent);
  color: var(--mb-color-bg-deep);
}

.mb-button--primary:hover {
  background: var(--mb-color-accent-hover);
}

.mb-button--secondary {
  background: transparent;
  border-color: var(--mb-color-border);
  color: var(--mb-color-text);
}

.mb-button--secondary:hover,
.mb-button--quiet:hover {
  border-color: var(--mb-color-text-muted);
  background: var(--mb-color-surface);
}

.mb-button--quiet {
  min-height: var(--mb-control-height-compact);
  background: transparent;
  color: var(--mb-color-text-support);
}

.mb-button--danger {
  background: transparent;
  border-color: var(--mb-color-danger);
  color: var(--mb-color-danger);
}

.mb-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}
</style>
