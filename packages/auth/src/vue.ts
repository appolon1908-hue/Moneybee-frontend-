import {
  defineComponent,
  h,
  inject,
  onMounted,
  ref,
  type InjectionKey,
  type VNode,
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
    const retrySetupAvailable = ref(false)
    const action = String(route.meta.authAction || "")
    const returnTo = () => safeReturnTo(route.query.returnTo)

    async function run(operation: () => Promise<void>, pending: string): Promise<void> {
      if (!auth || busy.value) return
      busy.value = true
      status.value = pending
      try {
        await operation()
      } catch (error) {
        busy.value = false
        status.value = error instanceof Error
          ? error.message
          : "The secure account request could not be started."
      }
    }

    async function beginLogin(provider?: "google"): Promise<void> {
      await run(
        () => provider === "google"
          ? auth!.loginWithGoogle(returnTo())
          : auth!.login(returnTo()),
        provider === "google"
          ? "Redirecting to Google through MoneyBee secure sign in…"
          : "Redirecting to secure username or email sign in…",
      )
    }

    async function beginRegistration(): Promise<void> {
      await run(
        () => auth!.register(returnTo()),
        "Opening secure borrower registration…",
      )
    }

    async function beginRecovery(): Promise<void> {
      await run(
        () => auth!.recoverAccount(returnTo()),
        "Opening Keycloak password recovery. Select Forgot password on the secure page…",
      )
    }

    async function beginPasswordChange(): Promise<void> {
      await run(
        () => auth!.changePassword("/auth/account"),
        "Opening secure password change…",
      )
    }

    async function beginEmailVerification(): Promise<void> {
      await run(
        () => auth!.verifyEmail(returnTo()),
        "Opening secure email verification…",
      )
    }

    async function retryAccountSetup(): Promise<void> {
      if (!auth || busy.value) return
      busy.value = true
      retrySetupAvailable.value = false
      status.value = "Retrying secure MoneyBee account setup…"
      try {
        await router.replace(await auth.retryAccountSetup())
      } catch (error) {
        busy.value = false
        retrySetupAvailable.value = true
        status.value = error instanceof Error
          ? error.message
          : "MoneyBee account setup could not be completed."
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
            status.value = "Sign in with your username or email, or continue with Google."
          }
        } else if (action === "register") {
          if (auth.isSelfRegistrationEnabled()) {
            await beginRegistration()
          } else {
            status.value = "Public registration is available only in the borrower portal. Lender and administrator accounts require an invitation."
          }
        } else if (action === "forgot-password") {
          status.value = "Password recovery is handled by Keycloak. Klyrow sends the one-time security email."
        } else if (action === "verify-email") {
          await beginEmailVerification()
        } else if (action === "callback") {
          status.value = "Completing secure sign in and MoneyBee account setup…"
          try {
            await router.replace(await auth.handleCallback())
          } catch (error) {
            busy.value = false
            retrySetupAvailable.value = true
            status.value = error instanceof Error
              ? error.message
              : "MoneyBee account setup could not be completed."
          }
        } else if (action === "silent-callback") {
          status.value = "Refreshing secure session…"
          await auth.handleSilentCallback()
        } else if (action === "logout") {
          status.value = "Signing out of MoneyBee and Keycloak…"
          await auth.logout()
        } else if (action === "change-password") {
          await beginPasswordChange()
        } else if (action === "account") {
          status.value = "Manage password, multifactor authentication, active sessions and linked sign-in methods in Keycloak."
        } else if (action === "session-expired") {
          status.value = "Your session expired. Sign in again to continue."
        } else if (action === "forbidden") {
          status.value = "You do not have permission to access this portal or organization."
        }
      } catch (error) {
        busy.value = false
        status.value = error instanceof Error
          ? error.message
          : "The secure session could not be completed. Please sign in again."
      }
    })

    function actionButton(label: string, onClick: () => void, secondary = false): VNode {
      return h("button", {
        type: "button",
        class: secondary ? "secondary" : undefined,
        disabled: busy.value,
        onClick,
      }, label)
    }

    function authLink(label: string, href: string): VNode {
      return h("a", { class: "auth-text-link", href }, label)
    }

    return () => {
      const actions: Array<VNode | null> = []
      if (action === "login") {
        actions.push(
          actionButton("Continue with username or email", () => void beginLogin()),
          auth?.isGoogleLoginEnabled()
            ? actionButton("Continue with Google", () => void beginLogin("google"), true)
            : null,
          auth?.isSelfRegistrationEnabled()
            ? authLink("Create a borrower account", `/auth/register?returnTo=${encodeURIComponent(returnTo())}`)
            : null,
          authLink("Forgot username or password?", `/auth/forgot-password?returnTo=${encodeURIComponent(returnTo())}`),
        )
      } else if (action === "register") {
        actions.push(
          auth?.isSelfRegistrationEnabled()
            ? actionButton("Create borrower account", () => void beginRegistration())
            : null,
          authLink("Already registered? Sign in", `/auth/login?returnTo=${encodeURIComponent(returnTo())}`),
        )
      } else if (action === "forgot-password") {
        actions.push(
          actionButton("Open secure password recovery", () => void beginRecovery()),
          authLink("Return to sign in", `/auth/login?returnTo=${encodeURIComponent(returnTo())}`),
        )
      } else if (action === "verify-email") {
        actions.push(
          actionButton("Verify email securely", () => void beginEmailVerification()),
        )
      } else if (action === "change-password") {
        actions.push(
          actionButton("Change password securely", () => void beginPasswordChange()),
          authLink("Return to account settings", "/auth/account"),
        )
      } else if (action === "account") {
        actions.push(
          h("a", { class: "button", href: auth?.accountConsoleUrl() || "#" }, "Open Keycloak account security"),
          authLink("Change password", "/auth/change-password"),
          authLink("Sign out", "/auth/logout"),
        )
      } else if (retrySetupAvailable.value) {
        actions.push(
          actionButton("Retry account setup", () => void retryAccountSetup()),
          authLink("Sign out and start again", "/auth/logout"),
        )
      } else if (action === "session-expired" || action === "forbidden") {
        actions.push(
          h("a", {
            class: "button auth-link",
            href: `/auth/login?returnTo=${encodeURIComponent(returnTo())}`,
          }, "Sign in"),
        )
      }

      return h("main", { class: "auth-shell" }, [
        h("section", { class: "auth-card" }, [
          h("div", { class: "brand" }, [
            h("span", { class: "mark", "aria-hidden": "true" }, "MB"),
            h("span", "MoneyBee"),
          ]),
          h("h1", action === "forbidden" ? "Access denied" : "Secure account"),
          h("p", { class: "lede", role: "status", "aria-live": "polite" }, status.value),
          h("div", { class: "auth-actions" }, actions),
          h("p", { class: "auth-note" },
            "Keycloak protects usernames, passwords, Google sign-in, MFA and sessions. MoneyBee never stores your password. Klyrow sends verification and password-recovery email.",
          ),
        ]),
      ])
    }
  },
})
