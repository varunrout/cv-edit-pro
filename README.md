# cv-edit-pro

## Environment variables

Copy [.env.example](.env.example) to `.env.local` for local development and fill in the values.

Required variables:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `AUTH_SECRET`
- `AUTH_URL`

## Vercel deployment

This app must use a hosted PostgreSQL database in production.

Recommended Vercel build command:

- `npm run vercel-build`

That command will:

1. generate the Prisma client
2. push the Prisma schema to the production database
3. build the Next.js app