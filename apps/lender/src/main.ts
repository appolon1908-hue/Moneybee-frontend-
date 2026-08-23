import { createApp } from "vue"
import { createPinia } from "pinia"
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query"
import {
  AUTH_MANAGER,
  createAuthManager,
  installPortalGuard,
} from "@moneybee/auth"
import {
  configureAccessTokenProvider,
  configureUnauthorizedHandler,
} from "@moneybee/api-client"
import "@moneybee/ui/styles.css"
import App from "./App.vue"
import router from "./router"

const app = createApp(App)
const auth = createAuthManager()
configureAccessTokenProvider(() => auth.getAccessToken())
configureUnauthorizedHandler(async () => Boolean(await auth.refreshSession()))
installPortalGuard(router, auth, { membershipType: "LENDER" })
app.provide(AUTH_MANAGER, auth)
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient: new QueryClient() })
app.mount("#app")
