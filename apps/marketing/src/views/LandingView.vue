<script setup lang="ts">
import { computed } from "vue"
import PrequalForm from "../components/PrequalForm.vue"
import { landingPages } from "../landingPages"

const props = defineProps<{slug: string}>()
const page = computed(() => landingPages[props.slug] || landingPages["business-loans"])
const borrowerUrl = String(import.meta.env.VITE_BORROWER_URL || "http://localhost:5174").replace(/\/$/, "")
const emailLoginUrl = `${borrowerUrl}/auth/login`
const googleLoginUrl = `${borrowerUrl}/auth/login?provider=google`
</script>

<template>
  <header class="container topbar">
    <a class="brand" href="/"><span class="mark">MB</span> MoneyBeeLoans</a>
    <nav aria-label="Primary">
      <a href="/how-it-works">How it works</a><a href="#uses">Uses</a><a href="/faq">FAQ</a>
      <a href="/for-lenders">For lenders</a>
      <a :href="googleLoginUrl">Google sign in</a>
      <a class="button" :href="emailLoginUrl">Email sign in</a>
    </nav>
  </header>
  <main>
    <section class="container hero">
      <div>
        <span class="eyebrow">MONEYBEELOANS</span>
        <h1>{{ page.title }}</h1>
        <p class="lede">{{ page.description }}</p>
        <p class="muted">Secure application | Multiple financing options | Human funding specialists</p>
        <div class="hero-actions">
          <a class="button" href="#prequal">Start request</a>
          <a class="button secondary" href="/callback">Request callback</a>
        </div>
        <div class="funding-visual" aria-label="MoneyBee funding review summary">
          <div>
            <span>Requested</span>
            <strong>$50k</strong>
          </div>
          <div>
            <span>Review</span>
            <strong>Secure</strong>
          </div>
          <div>
            <span>Next step</span>
            <strong>Portal</strong>
          </div>
        </div>
      </div>
      <PrequalForm id="prequal" :landing-page="props.slug" />
    </section>
    <section id="how" class="section" style="background:white">
      <div class="container">
        <h2>How MoneyBee works</h2>
        <div class="grid four">
          <div class="card">1. Tell us about your business</div>
          <div class="card">2. Complete your application</div>
          <div class="card">3. Review available options</div>
          <div class="card">4. Select your funding</div>
        </div>
      </div>
    </section>
    <section id="uses" class="container section">
      <h2>Funding built around real business needs</h2>
      <div class="grid three"><article v-for="item in page.useCases" :key="item" class="card">{{ item }}</article></div>
    </section>
    <section class="container section">
      <h2>Why this page fits</h2>
      <div class="grid three">
        <article v-for="item in page.proofPoints" :key="item" class="card">
          <strong>{{ item }}</strong>
          <p class="muted">{{ page.audience }}</p>
        </article>
      </div>
    </section>
    <section id="faq" class="container section">
      <h2>Important information</h2>
      <p class="lede">Submitting a request does not guarantee approval or funding. Products, terms and disclosures depend on eligibility, provider and jurisdiction.</p>
      <div class="grid three">
        <a class="card" href="/eligibility"><strong>Eligibility</strong><p class="muted">Understand common review factors.</p></a>
        <a class="card" href="/required-documents"><strong>Required documents</strong><p class="muted">Prepare common business records.</p></a>
        <a class="card" href="/contact"><strong>Contact MoneyBee</strong><p class="muted">Send a secure request.</p></a>
      </div>
    </section>
    <section class="container section legal-links" aria-label="Policy links">
      <a href="/privacy">Privacy</a>
      <a href="/cookie-notice">Cookies</a>
      <a href="/advertising-disclosure">Advertising disclosure</a>
      <a href="/privacy-choices">Privacy choices</a>
      <a href="/terms">Terms</a>
    </section>
  </main>
</template>

<style scoped>
.grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (max-width: 780px) { .grid.four { grid-template-columns: 1fr; } }
</style>
