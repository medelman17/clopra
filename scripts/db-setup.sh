#!/bin/bash

# Database setup script for CI/CD and local development

echo "🚀 Setting up database..."

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Push schema to database (creates tables if they don't exist)
echo "📋 Pushing schema to database..."
pnpm prisma db push --skip-generate

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# Run seed script if not in production
if [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Seeding database..."
  pnpm prisma db seed
fi

echo "✅ Database setup complete!"