<script setup lang="ts">
import { ref } from 'vue'
import MbButton from './MbButton.vue'

const navOpen = ref(false)
const links = [
  { label: 'Funding', href: '/#how-it-works' },
  { label: 'Industries', href: '/industries' },
  { label: 'Resources', href: '/resources' },
  { label: 'Company', href: '/company' },
]
</script>

<template>
  <header class="mb-header">
    <div class="mb-container header-inner">
      <a class="brand" href="/" aria-label="MoneyBee home">
        <span>MONEY</span><strong>BEE</strong>
      </a>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <a v-for="link in links" :key="link.href" :href="link.href">{{ link.label }}</a>
      </nav>

      <div class="header-actions">
        <MbButton href="/login" variant="quiet">Client login</MbButton>
        <MbButton href="/apply" variant="primary">Get funding</MbButton>
      </div>

      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="navOpen"
        aria-controls="mobile-navigation"
        aria-label="Toggle navigation"
        @click="navOpen = !navOpen"
      >
        <span />
        <span />
      </button>
    </div>

    <nav v-if="navOpen" id="mobile-navigation" class="mobile-nav" aria-label="Mobile navigation">
      <div class="mb-container mobile-nav-inner">
        <a v-for="link in links" :key="link.href" :href="link.href" @click="navOpen = false">{{ link.label }}</a>
        <a href="/login" @click="navOpen = false">Client login</a>
        <MbButton href="/apply" variant="primary">Get funding</MbButton>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.mb-header {
  position: sticky;
  z-index: 50;
  top: 0;
  min-height: var(--mb-header-height);
  border-bottom: 1px solid var(--mb-color-border);
  background: var(--mb-color-bg);
}

.header-inner {
  min-height: var(--mb-header-height);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--mb-space-8);
}

.brand {
  display: inline-flex;
  align-items: baseline;
  font-size: var(--mb-text-sm);
  font-weight: var(--mb-weight-bold);
  letter-spacing: var(--mb-tracking-wide);
}

.brand strong {
  color: var(--mb-color-accent);
}

.desktop-nav {
  display: flex;
  justify-content: center;
  gap: var(--mb-space-8);
}

.desktop-nav a,
.mobile-nav a {
  color: var(--mb-color-text-support);
  font-size: var(--mb-text-xs);
  font-weight: var(--mb-weight-medium);
  letter-spacing: var(--mb-tracking-wide);
  text-transform: uppercase;
  transition: color var(--mb-motion-fast) var(--mb-ease);
}

.desktop-nav a:hover,
.mobile-nav a:hover {
  color: var(--mb-color-text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--mb-space-2);
}

.menu-toggle {
  width: var(--mb-control-height-compact);
  height: var(--mb-control-height-compact);
  display: none;
  place-content: center;
  gap: var(--mb-space-2);
  border: 1px solid var(--mb-color-border);
  border-radius: var(--mb-radius-sm);
  background: transparent;
  color: var(--mb-color-text);
}

.menu-toggle span {
  width: 1.2rem;
  height: 1px;
  display: block;
  background: currentColor;
}

.mobile-nav {
  border-top: 1px solid var(--mb-color-border);
  background: var(--mb-color-bg-deep);
}

.mobile-nav-inner {
  display: grid;
  gap: var(--mb-space-5);
  padding-block: var(--mb-space-6);
}

@media (max-width: 980px) {
  .desktop-nav,
  .header-actions {
    display: none;
  }

  .header-inner {
    grid-template-columns: 1fr auto;
  }

  .menu-toggle {
    display: grid;
  }
}
</style>
