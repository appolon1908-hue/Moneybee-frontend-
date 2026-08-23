<template>
  <div class="portal">
    <aside class="sidebar"><div class="brand"><span class="mark">MB</span> MoneyBee</div>
      <nav><RouterLink to="/dashboard">Dashboard</RouterLink><RouterLink to="/application">Application</RouterLink>
        <RouterLink to="/conditions">Conditions</RouterLink><RouterLink to="/offers">Funding offers</RouterLink>
        <RouterLink to="/support">Support</RouterLink></nav>
    </aside>
    <main class="content"><RouterView /></main>
  </div>
</template>
