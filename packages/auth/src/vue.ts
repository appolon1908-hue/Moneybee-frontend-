import {
  defineComponent,
  h,
  inject,
  onMounted,
  ref,
  type InjectionKey,
} from "vue"
import { useRoute, useRouter } from "vue-router"
import type { MoneyBeeAuthManager } from "./auth-manager"
import { safeReturnTo } from "./errors"

export const AUTH_MANAGER: InjectionKey<MoneyBeeAuthManager> = Symbol("moneybee-auth-manager")

export const AuthRouteView = defineComponent({
  name: "AuthRouteView",
  setup() {
    const route = useRoute()
    const router = useRouter()
    const auth = inject(AUTH_MANAGER)
    const status = ref("Preparing secure session…")
    const action = String(route.meta.authAction || "")

    onMounted(async () => {
      if (!auth) {
        status.value = "Authentication configuration is unavailable."
        return
      }
      try {
        if (action === "login") {
          status.value = "Redirecting to secure sign in…"
          await auth.login(safeReturnTo(route.query.returnTo))
        } else if (action === "register") {
          if (!auth.canSelfRegister()) {
            status.value = "Public registration is available only from the MoneyBee borrower portal."
            return
          }
          status.value = "Opening secure account registration…"
          await auth.register(safeReturnTo(route.query.returnTo))
        } else if (action === "callback") {
          status.value = "Completing secure sign in and preparing your MoneyBee account…"
          await router.replace(await auth.handleCallback())
        } else if (action === "silent-callback") {
          status.value = "Refreshing secure session…"
          await auth.handleSilentCallback()
        } else if (action === "logout") {
          status.value = "Signing out…"
          await auth.logout()
        } else if (action === "session-expired") {
          status.value = "Your session expired. Sign in again to continue."
        } else if (action === "forbidden") {
          status.value = "You do not have permission to access this page."
        }
      } catch {
        status.value = action === "register"
          ? "Account registration could not be started. Please try again."
          : "The secure session could not be completed. Please sign in again."
      }
    })

    return () => h("main", { class: "auth-shell" }, [
      h("section", { class: "auth-card" }, [
        h("div", { class: "brand" }, "MoneyBee"),
        h("h1", action === "forbidden" ? "Access denied" : action === "register" ? "Create your account" : "Secure account"),
        h("p", status.value),
        (action === "session-expired" || action === "forbidden")
          ? h("a", { href: `/auth/login?returnTo=${encodeURIComponent(safeReturnTo(route.query.returnTo))}` }, "Sign in")
          : null,
        action === "login" && auth?.canSelfRegister()
          ? h("a", { href: `/auth/register?returnTo=${encodeURIComponent(safeReturnTo(route.query.returnTo))}` }, "Create account")
          : null,
        action === "register"
          ? h("a", { href: `/auth/login?returnTo=${encodeURIComponent(safeReturnTo(route.query.returnTo))}` }, "Already have an account? Sign in")
          : null,
      ]),
    ])
  },
})
