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
    const busy = ref(false)
    const action = String(route.meta.authAction || "")
    const returnTo = () => safeReturnTo(route.query.returnTo)

    async function beginLogin(provider?: "google"): Promise<void> {
      if (!auth || busy.value) return
      busy.value = true
      status.value = provider === "google"
        ? "Redirecting to Google through MoneyBee secure sign in…"
        : "Redirecting to secure email sign in…"
      try {
        if (provider === "google") await auth.loginWithGoogle(returnTo())
        else await auth.login(returnTo())
      } catch {
        busy.value = false
        status.value = "Sign in could not be started. Please try again."
      }
    }

    onMounted(async () => {
      if (!auth) {
        status.value = "Authentication configuration is unavailable."
        return
      }
      try {
        if (action === "login") {
          if (route.query.provider === "google") {
            await beginLogin("google")
          } else {
            status.value = "Choose a secure sign-in method."
          }
        } else if (action === "callback") {
          status.value = "Completing secure sign in…"
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
        status.value = "The secure session could not be completed. Please sign in again."
      }
    })

    return () => h("main", { class: "auth-shell" }, [
      h("section", { class: "auth-card" }, [
        h("div", { class: "brand" }, [
          h("span", { class: "mark", "aria-hidden": "true" }, "MB"),
          h("span", "MoneyBee"),
        ]),
        h("h1", action === "forbidden" ? "Access denied" : "Secure account"),
        h("p", { class: "lede" }, status.value),
        action === "login"
          ? h("div", { class: "auth-actions" }, [
              h("button", {
                type: "button",
                disabled: busy.value,
                onClick: () => beginLogin(),
              }, "Continue with email"),
              auth?.isGoogleLoginEnabled()
                ? h("button", {
                    type: "button",
                    class: "google-button",
                    disabled: busy.value,
                    onClick: () => beginLogin("google"),
                  }, [
                    h("span", { "aria-hidden": "true", class: "google-mark" }, "G"),
                    h("span", "Continue with Google"),
                  ])
                : null,
              h(
                "p",
                { class: "auth-note" },
                "Google authentication is brokered by Keycloak. MoneyBee never receives your Google password.",
              ),
            ])
          : null,
        (action === "session-expired" || action === "forbidden")
          ? h("a", {
              class: "button auth-link",
              href: `/auth/login?returnTo=${encodeURIComponent(returnTo())}`,
            }, "Sign in")
          : null,
      ]),
    ])
  },
})
