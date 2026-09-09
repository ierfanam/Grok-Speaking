# Grok Speaking

A modern web application built with Grok App Builder, powered by React 19, TanStack Start, and Tailwind CSS.

## Features

- ⚡ **Lightning Fast** - Built with modern technology and optimized performance
- 👥 **User Friendly** - Intuitive interface design that works on all devices
- 🔒 **Reliable** - Production-ready code with comprehensive testing

## Tech Stack

- **Frontend**: React 19, TanStack Router, TanStack Query
- **Styling**: Tailwind CSS v4, Radix UI
- **Server**: Vite + Nitro
- **Database**: PostgreSQL (with PGLite support)
- **Authentication**: Better Auth (optional)

## Getting Started

### Development

```bash
npm install
npm run dev
```

The app will be available at `http://0.0.0.0:8080`

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

## Project Structure

```
.
├── src/
│   ├── components/       # React components
│   ├── routes/          # TanStack Router routes
│   ├── lib/             # Utilities and helpers
│   ├── styles.css       # Global styles
│   └── router.tsx       # Router configuration
├── server/              # Server middleware
├── public/              # Static assets
└── vite.config.ts       # Vite configuration
```

## Deployment

This app is configured to deploy to Vercel. Push to GitHub and connect your repository to Vercel for automatic deployments.

## License

MIT
