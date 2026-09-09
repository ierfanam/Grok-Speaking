import { useEffect } from 'react'

/**
 * Silent bridge for preview proxy communication.
 * Enables the live preview UI to drive the app via postMessage.
 * No-op everywhere else.
 */
export function PreviewHostBridge() {
  useEffect(() => {
    // Listen for preview commands
    const handleMessage = (event: MessageEvent) => {
      // Handle any preview-specific commands here
      // This is a no-op in production
      console.debug('[PreviewHostBridge] Received message:', event.data)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return null
}