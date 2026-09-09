import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthProvider } from '@/lib/auth/client'
import { PreviewHostBridge } from '@/lib/preview/host-bridge'
import '@/styles.css'

const Root = () => {
  return (
    <AuthProvider>
      <PreviewHostBridge />
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Grok Speaking</title>
        </head>
        <body>
          <Outlet />
        </body>
      </html>
    </AuthProvider>
  )
}

export const Route = createRootRoute({
  component: Root,
})