<template>
  <div class="portal">
    <aside class="sidebar"><div class="brand"><span class="mark">MB</span> MoneyBee</div>
      <nav><RouterLink to="/dashboard">Dashboard</RouterLink><RouterLink to="/application">Application</RouterLink>
        <RouterLink to="/documents">Documents</RouterLink><RouterLink to="/banking">Bank connection</RouterLink>
        <RouterLink to="/offers">Funding offers</RouterLink></nav>
    </aside>
    <main class="content"><RouterView /></main>
  </div>
</template>
