<script setup lang="ts">
import { computed } from "vue"
import PublicInquiryForm from "../components/PublicInquiryForm.vue"
import type { PublicFormKind } from "../publicFormPayloads"

const props = defineProps<{
  kind: PublicFormKind
  slug: string
  defaultTopic?: string
}>()
const borrowerUrl = String(import.meta.env.VITE_BORROWER_URL || "http://localhost:5174").replace(/\/$/, "")
const copy = computed(() => ({
  contact: { title: "Talk with the MoneyBee team", description: "Send a secure contact request and receive a MoneyBee reference." },
  callback: { title: "Choose a convenient callback time", description: "Tell us when and why you would like to speak with a funding specialist." },
  lender: { title: "Partner with MoneyBee as a lender or bank", description: "Share your institution, coverage, and product focus through a controlled partnership intake." },
  referral: { title: "Build a responsible referral relationship", description: "Brokers and referral partners can submit an application for review without activating live delivery." },
  deal: { title: "Send a controlled deal inquiry", description: "Create a MoneyBee intake record for review. This form does not submit directly to any live lender." },
})[props.kind])
</script>

<template>
  <header class="container topbar">
    <a class="brand" href="/"><span class="mark">MB</span> MoneyBeeLoans</a>
    <nav aria-label="Primary">
      <a href="/how-it-works">How it works</a>
      <a href="/for-lenders">For lenders</a>
      <a href="/referral-partners">Partners</a>
      <a class="button" :href="borrowerUrl + '/auth/login'">Sign in</a>
    </nav>
  </header>
  <main>
    <section class="container hero">
      <div>
        <span class="eyebrow">BUSINESS LENDING NETWORK</span>
        <h1>{{ copy.title }}</h1>
        <p class="lede">{{ copy.description }}</p>
        <div class="grid three trust-grid">
          <div class="card"><strong>Authoritative intake</strong><p class="muted">MoneyBee stores the request before any external delivery.</p></div>
          <div class="card"><strong>Duplicate safe</strong><p class="muted">Idempotency protects repeated submissions.</p></div>
          <div class="card"><strong>Controlled CRM path</strong><p class="muted">Approved events queue through Codestra before Odoo.</p></div>
        </div>
      </div>
      <PublicInquiryForm :kind="props.kind" :landing-page="props.slug" :default-topic="props.defaultTopic" />
    </section>
  </main>
</template>
