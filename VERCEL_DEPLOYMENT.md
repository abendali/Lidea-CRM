# Deploying to Vercel

This project has been converted from an Express-based monolith to work with Vercel's serverless architecture.

## Architecture Changes

### Backend
- **Before**: Express server with session-based authentication
- **After**: Vercel serverless functions with JWT-based authentication

### Authentication
- Changed from session-based (express-session + passport) to JWT tokens
- Tokens are stored in httpOnly cookies for security
- Frontend code remains unchanged as cookies are automatically sent with requests

### API Structure
All API endpoints have been converted to serverless functions in the `api/` directory:
- `api/auth/` - Authentication endpoints (login, register, logout, user)
- `api/products/` - Product management
- `api/stock-movements/` - Stock movement tracking
- `api/cashflows/` - Cashflow management
- `api/workshop-orders/` - Workshop order management
- `api/users/` - User management
- `api/settings/` - Application settings
- `api/dashboard/` - Dashboard statistics
- `api/product-stock/` - Product stock management

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. GitHub account (to connect your repository)
3. PostgreSQL database (Vercel recommends Neon, Supabase, or Vercel Postgres)

## Deployment Steps

### 1. Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Convert to Vercel serverless architecture"

# Add your GitHub repository as remote
git remote add origin https://github.com/your-username/your-repo.git

# Push to GitHub
git push -u origin main
```

### 2. Import Project to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will automatically detect the configuration from `vercel.json`

### 3. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

**Required:**
- `DATABASE_URL` - Your PostgreSQL connection string
  - Example: `postgresql://user:password@host:5432/database`
  - For Neon: Get this from your Neon dashboard
  - For Supabase: Get this from your Supabase project settings

**Required:**
- `JWT_SECRET` - A secure random string for signing JWT tokens
  - Generate one: `openssl rand -base64 32`
  - Example: `A3k9P2mN8xQ7vB1sC5tL4wR9jD0eF6gH`
  - **CRITICAL**: This MUST be set or the application will fail to start

### 4. Deploy

Click "Deploy" in Vercel. The deployment process will:
1. Install dependencies (`npm install`)
2. Build the frontend (`vite build`)
3. Deploy serverless functions from the `api/` directory
4. Serve the static frontend from `dist/public`

### 5. Run Database Migrations

After the first deployment, you need to set up your database schema:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run database migration
npm run db:push
```

## Database Setup

### Using Neon (Recommended)

1. Create account at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add it to Vercel as `DATABASE_URL`

### Using Vercel Postgres

1. In your Vercel project dashboard, go to "Storage"
2. Click "Create Database" and select "Postgres"
3. The `DATABASE_URL` will be automatically added to your environment variables

### Using Supabase

1. Create account at https://supabase.com
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string (use "Connection pooling" for better performance)
5. Add it to Vercel as `DATABASE_URL`

## Local Development

For local development, continue using the Express server:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The development server will run on http://localhost:5000

## Testing Serverless Functions Locally

To test the Vercel serverless functions locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run Vercel dev server
vercel dev
```

This will start a local Vercel environment that simulates the production environment.

## Important Notes

1. **Cold Starts**: Serverless functions may have cold start latency (~1-2 seconds) when not used frequently
2. **Connection Pooling**: The database connection is configured with minimal pooling (`max: 1`) to work with serverless constraints
3. **Secrets**: Never commit sensitive information (API keys, database URLs) to the repository
4. **CORS**: Not needed since API and frontend are served from the same domain
5. **Session Storage**: Old Express sessions won't carry over - users will need to log in again after migration

## Troubleshooting

### API Errors
- Check Vercel function logs in the dashboard
- Ensure `DATABASE_URL` is correctly set
- Verify database is accessible from Vercel's IP addresses

### Authentication Issues
- Clear browser cookies
- Ensure `JWT_SECRET` is set in production
- Check that cookies are being set (httpOnly, secure in production)

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure TypeScript compiles without errors: `npm run check`
- Review build logs in Vercel dashboard

## Rollback to Express

If you need to rollback to the Express version:

1. The original Express server files are still in the `server/` directory
2. Revert the `vercel.json` and `api/` directory changes
3. Update package.json build script back to building the Express server
4. Deploy to a traditional Node.js hosting platform (Railway, Render, etc.)

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
