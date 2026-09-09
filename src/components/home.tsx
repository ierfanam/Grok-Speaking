import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Zap, Users } from 'lucide-react'

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white">Grok Speaking</h1>
          <Button variant="outline" className="text-white">Sign In</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-6 text-5xl font-bold text-white sm:text-6xl">
            Welcome to Grok Speaking
          </h2>
          <p className="mb-8 text-xl text-slate-300">
            A modern application powered by Grok App Builder
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-white">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h3 className="mb-12 text-center text-3xl font-bold text-white">Features</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <Zap className="mb-2 h-8 w-8 text-yellow-500" />
              <CardTitle className="text-white">Lightning Fast</CardTitle>
              <CardDescription className="text-slate-400">
                Built with modern technology
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              Experience blazing-fast performance with optimized code and efficient rendering.
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-blue-500" />
              <CardTitle className="text-white">User Friendly</CardTitle>
              <CardDescription className="text-slate-400">
                Intuitive interface design
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              Simple and elegant UI that works seamlessly on all devices.
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <Heart className="mb-2 h-8 w-8 text-red-500" />
              <CardTitle className="text-white">Reliable</CardTitle>
              <CardDescription className="text-slate-400">
                Built for stability
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              Production-ready code with comprehensive testing and monitoring.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-12">
          <h3 className="mb-4 text-3xl font-bold text-white">Ready to start?</h3>
          <p className="mb-8 text-slate-300">
            Join thousands of users building amazing applications.
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Launch Your App
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-400 sm:px-6 lg:px-8">
          <p>© 2025 Grok Speaking. Built with Grok App Builder.</p>
        </div>
      </footer>
    </div>
  )
}