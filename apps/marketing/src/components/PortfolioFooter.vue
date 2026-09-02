<script setup lang="ts">
import { CODESTRA_PRODUCT_NETWORK, MONEYBEE_DOMAINS } from "@moneybee/ui/portfolio"

const year = new Date().getFullYear()
</script>

<template>
  <footer class="portfolio-footer">
    <div class="container portfolio-footer__grid">
      <section class="portfolio-footer__intro" aria-labelledby="moneybee-footer-title">
        <a class="brand" href="/">
          <span class="mark">MB</span>
          <span>MoneyBeeLoans</span>
          <span class="domain-label">moneybeeloan.com</span>
        </a>
        <p class="portfolio-footer__eyebrow">Codestra product network</p>
        <h2 id="moneybee-footer-title" class="portfolio-footer__title">
          Business funding requests with clear next steps and protected portals.
        </h2>
        <p class="portfolio-footer__copy">
          Submitting a request does not guarantee approval or funding. Products, terms, fees, eligibility, and disclosures depend on provider and jurisdiction.
        </p>
        <div class="domain-list" aria-label="MoneyBee domains">
          <a class="domain-chip" :href="MONEYBEE_DOMAINS.public">moneybeeloan.com</a>
          <a class="domain-chip" :href="MONEYBEE_DOMAINS.borrower">app.moneybeeloan.com</a>
          <a class="domain-chip" :href="MONEYBEE_DOMAINS.lenders">lenders.moneybeeloan.com</a>
          <a class="domain-chip" :href="MONEYBEE_DOMAINS.administration">admin.moneybeeloan.com</a>
        </div>
      </section>

      <nav aria-label="Funding information">
        <h3 class="portfolio-footer__heading">Funding</h3>
        <ul class="portfolio-footer__links">
          <li><a class="portfolio-footer__link" href="/business-loans">Business loans</a></li>
          <li><a class="portfolio-footer__link" href="/lines-of-credit">Lines of credit</a></li>
          <li><a class="portfolio-footer__link" href="/equipment-financing">Equipment financing</a></li>
          <li><a class="portfolio-footer__link" href="/working-capital">Working capital</a></li>
          <li><a class="portfolio-footer__link" href="/eligibility">Eligibility</a></li>
        </ul>
      </nav>

      <nav aria-label="MoneyBee resources">
        <h3 class="portfolio-footer__heading">Resources</h3>
        <ul class="portfolio-footer__links">
          <li><a class="portfolio-footer__link" href="/how-it-works">How it works</a></li>
          <li><a class="portfolio-footer__link" href="/required-documents">Required documents</a></li>
          <li><a class="portfolio-footer__link" href="/faq">FAQ</a></li>
          <li><a class="portfolio-footer__link" href="/for-lenders">For lenders</a></li>
          <li><a class="portfolio-footer__link" href="/contact">Contact</a></li>
        </ul>
      </nav>

      <nav aria-label="MoneyBee legal links">
        <h3 class="portfolio-footer__heading">Trust</h3>
        <ul class="portfolio-footer__links">
          <li><a class="portfolio-footer__link" href="/privacy">Privacy</a></li>
          <li><a class="portfolio-footer__link" href="/privacy-choices">Privacy choices</a></li>
          <li><a class="portfolio-footer__link" href="/cookie-notice">Cookies</a></li>
          <li><a class="portfolio-footer__link" href="/advertising-disclosure">Advertising disclosure</a></li>
          <li><a class="portfolio-footer__link" href="/terms">Terms</a></li>
        </ul>
      </nav>

      <div class="portfolio-footer__bottom">
        <span>© {{ year }} MoneyBeeLoans. Operated within the Codestra platform.</span>
        <div class="portfolio-footer__network" aria-label="Codestra products">
          <a v-for="product in CODESTRA_PRODUCT_NETWORK" :key="product.href" class="portfolio-footer__link" :href="product.href">
            {{ product.label }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
