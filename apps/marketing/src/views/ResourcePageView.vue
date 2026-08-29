<script setup lang="ts">
import { computed } from "vue"
import { resourcePages } from "../resourcePages"

const props = defineProps<{ slug: string }>()
const page = computed(() => resourcePages[props.slug] || resourcePages.faq)
const borrowerUrl = String(import.meta.env.VITE_BORROWER_URL || "http://localhost:5174").replace(/\/$/, "")
</script>

<template>
  <header class="container topbar">
    <a class="brand" href="/"><span class="mark">MB</span> MoneyBeeLoans</a>
    <nav aria-label="Primary">
      <a href="/business-loans">Funding</a>
      <a href="/for-lenders">For lenders</a>
      <a href="/contact">Contact</a>
      <a class="button" :href="borrowerUrl + '/auth/login'">Sign in</a>
    </nav>
  </header>
  <main>
    <section class="container section resource-hero">
      <span class="eyebrow">MONEYBEE RESOURCE CENTER</span>
      <h1>{{ page.title }}</h1>
      <p class="lede">{{ page.description }}</p>
    </section>
    <section class="container section grid three">
      <article v-for="section in page.sections" :key="section.heading" class="card">
        <h2>{{ section.heading }}</h2>
        <p class="muted">{{ section.body }}</p>
      </article>
    </section>
    <section class="container section legal-links" aria-label="Related MoneyBee pages">
      <a href="/business-loans">Business funding</a>
      <a href="/privacy">Privacy</a>
      <a href="/cookie-notice">Cookies</a>
      <a href="/advertising-disclosure">Advertising disclosure</a>
      <a href="/contact">Contact</a>
    </section>
  </main>
</template>
