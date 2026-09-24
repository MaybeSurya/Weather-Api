---
last_mapped_commit: 14fdd09a3dbed09f409564b8a6c1c58dbe6b291e
last_mapped_at: 2026-09-25
---
# Technology Stack

**Analysis Date:** 2026-09-25

## Languages

**Primary:**

- TypeScript 5.x - All application, domain, API route, and test code (`src/**/*.ts`, `src/**/*.tsx`, `tests/**/*.ts`)

**Secondary:**

- JavaScript (ES Modules / CommonJS) - Build configuration (`postcss.config.mjs`, `eslint.config.mjs`)

## Runtime

**Environment:**

- Node.js >= 20.9 (tested on Node v22.19.0)
- Vercel Serverless / Edge Runtime for production hosting

**Package Manager:**

- npm 10.x
- Lockfile: `package-lock.json` present and tracked

## Frameworks

**Core:**

- Next.js 16.3.6 (App Router + Turbopack) - Web application framework, routing, and serverless API handlers
- React 19.2.8 / React DOM 19.2.8 - Component rendering and UI state management
- Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/postcss`) - Utility-first styling with modern PostCSS pipeline

**Testing:**

- Vitest v5.0.1 - Unit and integration test runner with TypeScript support

**Build/Dev:**

- Turbopack (`next dev`, `next build`) - High-performance bundler
- ESLint 9 (`eslint`, `eslint-config-next`) - Code quality and Next.js rule enforcement

## Key Dependencies

**Production:**

- `@upstash/ratelimit` ^2.2.0 - Distributed sliding-window rate limiting algorithm
- `@upstash/redis` ^1.39.0 - Serverless HTTP Redis client for rate limit counter persistence

**Development:**

- `@types/node` ^22.20.4 - Node.js type definitions
- `@types/react` ^19 / `@types/react-dom` ^19 - React 19 type definitions

## Configuration Files

- `next.config.ts` - Next.js routing configuration (permanent 308 redirects for `/weather` and `/weather/api`)
- `tsconfig.json` - TypeScript compiler options, path alias `@/*` mapping to `./src/*`
- `postcss.config.mjs` - PostCSS plugin configuration for Tailwind CSS v4
- `eslint.config.mjs` - ESLint 9 flat configuration with Next.js core web vitals and TypeScript rules
- `vitest.config.mts` - Vitest test configuration with path resolution and globals support
- `.env.example` - Template for environment variables and secrets documentation
