<script setup lang="ts">
import { MbButton } from '@moneybee/design-system'

const proofPoints = [
  { value: 'FAST', label: 'A clear application path without visual clutter.' },
  { value: 'SECURE', label: 'Sensitive decisions and financial logic remain backend-owned.' },
  { value: 'HUMAN', label: 'Plain-language guidance at every major decision point.' },
]

const steps = [
  ['01', 'Tell us about your business', 'A focused application experience built around the information required to evaluate funding options.'],
  ['02', 'Review available options', 'Backend-authoritative eligibility, disclosures and offer details are presented consistently and transparently.'],
  ['03', 'Move forward confidently', 'Clear next steps, status visibility and support keep the experience understandable from application to funding.'],
]
</script>

<template>
  <main>
    <section class="hero section-pad">
      <div class="mb-container hero-grid">
        <div class="hero-copy">
          <p class="mb-eyebrow">MONEYBEE BUSINESS FUNDING</p>
          <h1>Capital that keeps your business moving.</h1>
          <p class="hero-lede">
            A disciplined, transparent funding experience for business owners who value speed, clarity and professional support.
          </p>
          <div class="hero-actions">
            <MbButton href="#apply" variant="primary">Check funding options</MbButton>
            <MbButton href="#how-it-works" variant="secondary">How it works</MbButton>
          </div>
          <p class="microcopy">No decorative gimmicks. No hidden visual hierarchy. Just a focused path to the next step.</p>
        </div>

        <aside class="hero-panel" aria-label="MoneyBee experience principles">
          <span class="panel-kicker">BUILT FOR CLARITY</span>
          <div v-for="point in proofPoints" :key="point.value" class="proof-row">
            <strong>{{ point.value }}</strong>
            <span>{{ point.label }}</span>
          </div>
        </aside>
      </div>
    </section>

    <section id="how-it-works" class="section-pad section-rule">
      <div class="mb-container">
        <div class="section-heading">
          <p class="mb-eyebrow">HOW IT WORKS</p>
          <h2>One clear path from interest to action.</h2>
          <p>Each step uses the same typography, spacing, states and CTA rules so the experience stays predictable.</p>
        </div>

        <div class="steps-grid">
          <article v-for="step in steps" :key="step[0]" class="step-card">
            <span class="step-number">{{ step[0] }}</span>
            <h3>{{ step[1] }}</h3>
            <p>{{ step[2] }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="apply" class="conversion section-pad section-rule">
      <div class="mb-container conversion-inner">
        <div>
          <p class="mb-eyebrow">READY WHEN YOU ARE</p>
          <h2>Build momentum with a better funding experience.</h2>
        </div>
        <MbButton href="/apply" variant="primary">Start application</MbButton>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hero {
  min-height: calc(100vh - var(--mb-header-height));
  display: grid;
  align-items: center;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 0.55fr);
  gap: var(--mb-space-16);
  align-items: end;
}

.hero-copy {
  max-width: 52rem;
}

.hero h1 {
  margin: var(--mb-space-4) 0 var(--mb-space-6);
  max-width: 13ch;
}

.hero-lede {
  max-width: 44rem;
  font-size: var(--mb-text-lg);
  color: var(--mb-color-text-support);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mb-space-3);
  margin-top: var(--mb-space-8);
}

.microcopy {
  margin-top: var(--mb-space-4);
  font-size: var(--mb-text-sm);
  color: var(--mb-color-text-muted);
}

.hero-panel {
  border-top: 1px solid var(--mb-color-border);
  border-bottom: 1px solid var(--mb-color-border);
}

.panel-kicker {
  display: block;
  padding: var(--mb-space-4) 0;
  color: var(--mb-color-accent);
  font-size: var(--mb-text-xs);
  font-weight: var(--mb-weight-semibold);
  letter-spacing: var(--mb-tracking-wide);
}

.proof-row {
  display: grid;
  grid-template-columns: 6.5rem 1fr;
  gap: var(--mb-space-4);
  padding: var(--mb-space-5) 0;
  border-top: 1px solid var(--mb-color-border);
}

.proof-row strong {
  font-size: var(--mb-text-xs);
  letter-spacing: var(--mb-tracking-wide);
}

.proof-row span,
.section-heading > p,
.step-card p {
  color: var(--mb-color-text-muted);
}

.section-rule {
  border-top: 1px solid var(--mb-color-border);
}

.section-heading {
  display: grid;
  grid-template-columns: 0.45fr 1fr 0.75fr;
  gap: var(--mb-space-8);
  align-items: start;
}

.section-heading h2,
.section-heading p {
  margin: 0;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: var(--mb-space-12);
  border-top: 1px solid var(--mb-color-border);
}

.step-card {
  min-height: 20rem;
  padding: var(--mb-space-6);
  border-right: 1px solid var(--mb-color-border);
}

.step-card:first-child {
  border-left: 1px solid var(--mb-color-border);
}

.step-number {
  display: block;
  margin-bottom: var(--mb-space-16);
  color: var(--mb-color-accent);
  font-size: var(--mb-text-xs);
  font-weight: var(--mb-weight-semibold);
  letter-spacing: var(--mb-tracking-wide);
}

.step-card h3 {
  margin-bottom: var(--mb-space-4);
}

.conversion-inner {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--mb-space-8);
}

.conversion h2 {
  max-width: 15ch;
  margin: var(--mb-space-4) 0 0;
}

@media (max-width: 900px) {
  .hero-grid,
  .section-heading,
  .steps-grid {
    grid-template-columns: 1fr;
  }

  .step-card,
  .step-card:first-child {
    border-left: 1px solid var(--mb-color-border);
    border-right: 1px solid var(--mb-color-border);
    border-bottom: 1px solid var(--mb-color-border);
  }

  .conversion-inner {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
