<template>
  <div class="portal">
    <aside class="sidebar">
      <div class="brand"><span class="mark">MB</span> MoneyBee</div>
      <nav>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/application">Application overview</RouterLink>
        <RouterLink to="/business">Business</RouterLink>
        <RouterLink to="/financials">Financials</RouterLink>
        <RouterLink to="/owners">Owners</RouterLink>
        <RouterLink to="/documents">Documents</RouterLink>
        <RouterLink to="/banking">Banking</RouterLink>
        <RouterLink to="/verification">Verification</RouterLink>
        <RouterLink to="/conditions">Conditions</RouterLink>
        <RouterLink to="/offers">Funding offers</RouterLink>
        <RouterLink to="/funding">Funding status</RouterLink>
        <RouterLink to="/contracts">Contract</RouterLink>
        <RouterLink to="/renewals">Renewals</RouterLink>
        <RouterLink to="/profile">Profile</RouterLink>
        <RouterLink to="/support">Support</RouterLink>
      </nav>
    </aside>
    <main class="content"><RouterView /></main>
  </div>
</template>
