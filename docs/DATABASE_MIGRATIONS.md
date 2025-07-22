# Database Migrations Strategy

## Overview

This document outlines how we handle database migrations in different environments.

## Development

For local development:

```bash
# Push schema changes to database
pnpm db:push

# Seed database with initial data
pnpm db:seed

# Or run complete setup
pnpm db:setup
```

## Production (Vercel)

### Automatic Schema Updates

In production, we use `prisma db push` instead of migrations for simplicity:

1. **Build Command**: Already includes `prisma generate`
2. **Database Schema**: Manually run `prisma db push` after deployment

### Manual Steps After Deployment

```bash
# 1. Pull latest env vars from Vercel
vercel env pull

# 2. Push schema to production database
pnpm prisma db push --skip-generate

# 3. Optionally seed initial data (one-time only)
pnpm prisma db seed
```

### CI/CD Pipeline (GitHub Actions)

For automated deployments, add this to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Generate Prisma Client
        run: pnpm prisma generate
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          
      - name: Push Database Schema
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: pnpm prisma db push --skip-generate
```

## Environment Variables

Required in CI/CD:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `VERCEL_TOKEN` - For deployment
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

## Best Practices

1. **Schema Changes**: Always test locally first with `prisma db push`
2. **Migrations**: For complex changes, consider using proper migrations
3. **Backups**: Always backup production data before schema changes
4. **Monitoring**: Check Vercel logs after deployment

## Troubleshooting

### Connection Issues
- Ensure DATABASE_URL includes `?sslmode=require`
- Check Neon dashboard for connection limits
- Verify IP allowlisting if enabled

### Schema Conflicts
- Run `prisma db pull` to sync local schema with production
- Resolve conflicts manually
- Push resolved schema back to production