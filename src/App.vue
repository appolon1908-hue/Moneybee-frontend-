<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { currentUser, login, logout, userManager, type User } from './auth'

const user = ref<User | null>(null)
const onUserLoaded = (loadedUser: User) => { user.value = loadedUser }
onMounted(async () => { user.value = await currentUser(); userManager.events.addUserLoaded(onUserLoaded) })
onUnmounted(() => userManager.events.removeUserLoaded(onUserLoaded))
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/">MoneyBeeLoans</RouterLink>
    <nav aria-label="Primary navigation">
      <RouterLink to="/apply">Apply</RouterLink>
      <RouterLink to="/portal">Client portal</RouterLink>
      <RouterLink to="/lender">Lender portal</RouterLink>
      <RouterLink to="/admin">Operations</RouterLink>
      <button v-if="user" class="link-button" @click="logout">Sign out</button>
      <button v-else class="link-button" @click="login">Sign in</button>
    </nav>
  </header>
  <main><RouterView /></main>
  <footer>MoneyBeeLoans · Business funding that keeps you moving.</footer>
</template>
