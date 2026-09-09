import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
  })
}

function AppErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <h1 className="text-3xl font-bold text-red-600">Something went wrong</h1>
      <p className="text-lg text-foreground">{error.message}</p>
      <details className="whitespace-pre-wrap rounded bg-muted p-4">
        {error.stack}
      </details>
    </div>
  )
}