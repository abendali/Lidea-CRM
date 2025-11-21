# Deploying to Netlify

This project is configured to deploy to Netlify with serverless functions for the backend and a static React frontend.

## Architecture

### Frontend
- Built with Vite and deployed as static files to `dist/public`
- Served from Netlify's CDN

### Backend
- Express app wrapped with `serverless-http`
- Deployed as a Netlify serverless function at `/.netlify/functions/api`
- All `/api/*` routes are redirected to the serverless function

## Prerequisites

1. **Netlify Account**: Sign up at https://netlify.com
2. **Git Repository**: Your code must be in a GitHub, GitLab, or Bitbucket repository
3. **PostgreSQL Database**: Use Supabase, Neon, or any PostgreSQL provider
4. **Supabase Account** (for authentication): Sign up at https://supabase.com

## Deployment Steps

### 1. Prepare Your Repository

Make sure all files are committed and pushed to your Git repository:

```bash
git add .
git commit -m "Add Netlify deployment configuration"
git push
```

### 2. Import Project to Netlify

1. Go to https://app.netlify.com/start
2. Click "Add new site" → "Import an existing project"
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Select your repository
5. Netlify will automatically detect the configuration from `netlify.toml`

### 3. Configure Environment Variables

In the Netlify site settings, go to **Site settings → Environment variables**, and add:

**Required for Database:**
- `DATABASE_URL` - Your PostgreSQL connection string
  - Example: `postgresql://user:password@host:5432/database?sslmode=require`
  - For Supabase: Get from Project Settings → Database → Connection string → URI
  - For Neon: Get from your Neon dashboard

**Required for Authentication:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
  - Example: `https://xxxxxxxxxxxxx.supabase.co`
  - Get from Supabase Project Settings → API → Project URL
  
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
  - Get from Supabase Project Settings → API → Project API keys → anon public

- `SUPABASE_URL` - Same as `VITE_SUPABASE_URL`

- `SUPABASE_ANON_KEY` - Same as `VITE_SUPABASE_ANON_KEY`

**Optional but Recommended:**
- `JWT_SECRET` - A secure random string for signing JWT tokens
  - Generate one: `openssl rand -base64 32`
  - If not set, a default development secret will be used (not secure for production)

### 4. Deploy

Click "Deploy site" in Netlify. The deployment process will:
1. Install dependencies (`npm install`)
2. Build the frontend (`npm run build`)
3. Deploy the serverless function from `netlify/functions/api.ts`
4. Serve the static frontend from `dist/public`

### 5. Run Database Migrations

After the first deployment:

1. Install Netlify CLI locally:
   ```bash
   npm install -g netlify-cli
   ```

2. Link your local project to your Netlify site:
   ```bash
   netlify link
   ```

3. Run database migrations using Netlify CLI:
   ```bash
   netlify env:import .env  # Import your local env vars (optional)
   npm run db:push
   ```

Alternatively, you can run migrations from your local machine if `DATABASE_URL` is set in your local `.env` file.

## Local Development with Netlify

To test the Netlify serverless functions locally:

```bash
# Install Netlify CLI if you haven't already
npm install -g netlify-cli

# Start the Netlify dev server
netlify dev
```

This will:
- Start your React dev server
- Run the serverless functions locally
- Set up proper redirects

Access your app at `http://localhost:8888`

## Deployment Differences: Netlify vs Vercel

| Feature | Netlify | Vercel |
|---------|---------|--------|
| Functions Directory | `netlify/functions/` | `api/` |
| Function Wrapper | `serverless-http` | Built-in |
| Config File | `netlify.toml` | `vercel.json` |
| Local Dev | `netlify dev` | `vercel dev` |
| Build Command | Set in `netlify.toml` | Set in `vercel.json` |

## Troubleshooting

### 404 Error on API Routes

**Issue**: Getting 404 errors when calling `/api/*` endpoints

**Solution**: 
1. Check that `netlify.toml` has the correct redirects configuration
2. Verify the function file is at `netlify/functions/api.ts`
3. Check Netlify build logs for any compilation errors

### Function Invocation Failed

**Issue**: 500 error or "Function invocation failed"

**Solution**:
1. Check Netlify function logs in the Netlify dashboard (Functions tab)
2. Verify all environment variables are set correctly
3. Ensure `DATABASE_URL` is valid and accessible from Netlify
4. Check that `serverless-http` package is installed

### Database Connection Issues

**Issue**: "Connection timeout" or "SSL required"

**Solution**:
1. Make sure your `DATABASE_URL` includes `?sslmode=require`
2. For Supabase: Use the "Connection string" → "URI" format
3. Check that your database accepts connections from Netlify's IP addresses
4. Verify the connection string is correct in Netlify environment variables

### Build Failures

**Issue**: Build fails during deployment

**Solution**:
1. Check the build logs in Netlify dashboard
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript compilation succeeds locally: `npm run build`
4. Check Node.js version compatibility

## Authentication Flow

This app uses **dual authentication**:

1. **JWT-based auth** (default): For `/api/register`, `/api/login`, `/api/logout`, `/api/user`
   - Uses JWT tokens stored in httpOnly cookies
   - Works without Supabase

2. **Supabase auth**: For `/api/auth/*` endpoints
   - Uses Supabase authentication service
   - Requires Supabase environment variables to be set
   - Frontend uses these endpoints by default

Make sure to configure your frontend to use the correct authentication endpoints based on your setup.

## Viewing Logs

To view function logs in real-time:

```bash
netlify functions:log api
```

Or view them in the Netlify dashboard under **Functions** → **api** → **Logs**

## Custom Domain

To add a custom domain:

1. Go to **Site settings** → **Domain management**
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

## Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [Deploying Express to Netlify](https://docs.netlify.com/frameworks/express/)
- [Environment Variables on Netlify](https://docs.netlify.com/environment-variables/overview/)
