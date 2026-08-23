declare global {
  interface Window {
    Plaid?: {
      create(config: {
        token: string
        onSuccess: (publicToken: string, metadata: unknown) => void
        onExit?: (error: unknown, metadata: unknown) => void
        onEvent?: (eventName: string, metadata: unknown) => void
      }): {
        open(): void
        destroy(): void
      }
    }
  }
}

let loadPromise: Promise<void> | null = null

export function loadPlaid(): Promise<void> {
  if (window.Plaid) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Unable to load Plaid Link"))
    document.head.appendChild(script)
  })

  return loadPromise
}
