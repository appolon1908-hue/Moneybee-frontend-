import { createApp } from "vue"
import { createPinia } from "pinia"
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query"
import "@moneybee/ui/styles.css"
import App from "./App.vue"
import router from "./router"

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient: new QueryClient() })
app.mount("#app")
