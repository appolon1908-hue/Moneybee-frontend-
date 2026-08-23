<template><div class="portal"><aside class="sidebar">
  <div class="brand"><span class="mark">MB</span> Control Center</div>
  <nav><RouterLink to="/dashboard">Dashboard</RouterLink><RouterLink to="/leads">Leads</RouterLink>
  <RouterLink to="/applications">Applications</RouterLink><RouterLink to="/lenders">Lenders</RouterLink>
  <RouterLink to="/operations">Lifecycle operations</RouterLink><RouterLink to="/crm">CRM & integrations</RouterLink>
  <RouterLink to="/audit">Audit</RouterLink><RouterLink to="/system">System</RouterLink></nav>
</aside><main class="content"><RouterView /></main></div></template>
