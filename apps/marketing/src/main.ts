import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import '@moneybee/design-system/styles'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

createApp(App).use(router).mount('#app')
