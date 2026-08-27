<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mb-footer">
    <div class="mb-container footer-top">
      <div class="footer-brand">
        <a class="brand" href="/" aria-label="MoneyBee home">MONEY<strong>BEE</strong></a>
        <p>Business funding that keeps you moving.</p>
      </div>

      <div class="footer-column">
        <span>Funding</span>
        <a href="/apply">Apply</a>
        <a href="/industries">Industries</a>
        <a href="/resources">Resources</a>
      </div>

      <div class="footer-column">
        <span>Company</span>
        <a href="/company">About</a>
        <a href="/contact">Contact</a>
        <a href="/login">Client login</a>
      </div>

      <div class="footer-column">
        <span>Legal</span>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/disclosures">Disclosures</a>
      </div>
    </div>

    <div class="mb-container footer-bottom">
      <span>© {{ year }} MoneyBeeLoans</span>
      <span>Funding products, eligibility and disclosures are backend-authoritative.</span>
    </div>
  </footer>
</template>

<style scoped>
.mb-footer {
  border-top: 1px solid var(--mb-color-border);
  background: var(--mb-color-bg-deep);
}

.footer-top {
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: var(--mb-space-12);
  padding-block: var(--mb-space-20);
}

.footer-brand {
  max-width: 22rem;
}

.brand {
  display: inline-flex;
  margin-bottom: var(--mb-space-5);
  font-size: var(--mb-text-sm);
  font-weight: var(--mb-weight-bold);
  letter-spacing: var(--mb-tracking-wide);
}

.brand strong {
  color: var(--mb-color-accent);
}

.footer-brand p,
.footer-column a,
.footer-bottom {
  color: var(--mb-color-text-muted);
}

.footer-column {
  display: grid;
  align-content: start;
  gap: var(--mb-space-3);
  font-size: var(--mb-text-sm);
}

.footer-column > span {
  margin-bottom: var(--mb-space-2);
  color: var(--mb-color-text);
  font-size: var(--mb-text-xs);
  font-weight: var(--mb-weight-semibold);
  letter-spacing: var(--mb-tracking-wide);
  text-transform: uppercase;
}

.footer-column a:hover {
  color: var(--mb-color-text);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: var(--mb-space-6);
  padding-block: var(--mb-space-5);
  border-top: 1px solid var(--mb-color-border);
  font-size: var(--mb-text-xs);
}

@media (max-width: 760px) {
  .footer-top {
    grid-template-columns: 1fr 1fr;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }

  .footer-bottom {
    flex-direction: column;
  }
}
</style>
