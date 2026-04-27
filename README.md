# Crensa

Crensa is a Next.js 15 platform for creator and member experiences, including video discovery, watch flows, wallets, notifications, creator dashboards, and membership/payment features.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Drizzle ORM + PostgreSQL (Neon compatible)
- Clerk authentication
- Cloudinary video/media integrations
- Razorpay payment integrations
- Jest + Testing Library

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (local or hosted)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create local environment file from the template:

```bash
copy .env.local.example .env.local
```

3. Update required values in `.env.local` (see Environment Variables).

4. Run the development server:

```bash
npm run dev
```

5. Open http://localhost:3000

## Environment Variables

Use `.env.local.example` as the source of truth. Commonly required variables:

### Core

- `NODE_ENV`
- `NEXT_PUBLIC_STAGE`
- `NEXT_PUBLIC_BASE_URL`
- `DATABASE_URL`

### Authentication (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

### Cloudinary

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Payments (Razorpay)

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

### Email / Support

- `ADMIN_EMAIL`
- `ADMIN_EMAIL_USER`
- `ADMIN_EMAIL_PASS`
- `EMAIL_USER`
- `EMAIL_PASS`
- `NEXT_PUBLIC_SUPPORT_EMAIL`

### Optional UX / Platform Flags

- `NEXT_PUBLIC_ENABLE_EARLY_ACCESS`
- `NEXT_PUBLIC_SHOW_FOUNDER_BENEFITS`
- `NEXT_PUBLIC_ENABLE_TESTIMONIALS`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `NEXT_PUBLIC_SHARE_URL`

## Scripts

### App Lifecycle

- `npm run dev` - Start local development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run Next.js lint checks

### Testing

- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:a11y` - Accessibility/performance-focused test path
- `npm run test:db` - Database test path (serial)

### Database (Drizzle)

- `npm run db:generate` - Generate migrations with Drizzle
- `npm run db:migrate` - Apply database migrations via project migrator
- `npm run db:seed` - Seed local/dev data
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:test` - Verify Neon DB connection
- `npm run db:verify` - Verify database structure
- `npm run db:backup` - Run DB backup helper

### Performance

- `npm run lighthouse` - Run Lighthouse against localhost:3000
- `npm run audit` - Build, start, then run Lighthouse (Unix-style command chaining)

## Database Notes

- Drizzle kit config uses `.env.local` and reads `DATABASE_URL`.
- Migration SQL files are stored in `drizzle/`.
- Project schema is in `src/lib/database/schema.ts`.

## Project Structure (High Level)

- `src/app` - App Router pages and API routes
- `src/components` - Shared and domain-specific UI components
- `src/lib` - Services, database, utilities, and business logic
- `src/config` - Environment and runtime configuration
- `drizzle` - Migration artifacts and SQL history
- `scripts` - One-off scripts for migration, verification, and diagnostics
- `public` - Static assets, icons, PWA files, media

## Deployment

- Production deployment is configured for Vercel (`vercel.json`).
- Ensure all required environment variables are set in your deployment target.
- Run `npm run build` before release validation.

## Troubleshooting

- Build/type issues: run `npm run build` and check TypeScript output.
- DB connection issues: verify `DATABASE_URL`, then run `npm run db:test`.
- Payment issues: verify Razorpay keys and webhook secret.
- Upload issues: verify Cloudinary credentials.

## Additional Documentation

- `UPDATED_SIGNUP_FLOWS.md` for signup flow updates and notes.
