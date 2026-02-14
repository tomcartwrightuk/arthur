# Cloudflare Pages Deployment Guide

## Quick Deploy

### Method 1: GitHub + Cloudflare Pages (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Crash Kart game"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to https://dash.cloudflare.com/
   - Navigate to "Workers & Pages" → "Pages"
   - Click "Create application" → "Connect to Git"
   - Select your repository
   - Configure build settings:
     - **Framework preset**: None
     - **Build command**: `bun install && bun run build`
     - **Build output directory**: `dist`
     - **Node version**: (not needed, using Bun)
   - Add environment variable (if needed):
     - `BUN_VERSION`: `latest`
   - Click "Save and Deploy"

3. **Done!** Your game will be live at `https://crash-kart.pages.dev` (or your custom domain)

### Method 2: Direct Upload via Wrangler

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   # or
   bun add -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Build and Deploy**:
   ```bash
   bun run build
   wrangler pages deploy dist --project-name=crash-kart
   ```

### Method 3: Manual Upload

1. **Build the project**:
   ```bash
   bun run build
   ```

2. **Upload via Dashboard**:
   - Go to https://dash.cloudflare.com/
   - Navigate to "Workers & Pages" → "Pages"
   - Click "Upload assets"
   - Drag and drop the entire `dist/` folder
   - Click "Deploy site"

## Build Configuration for Cloudflare Pages

If using the Cloudflare Pages dashboard, use these settings:

```yaml
Build command: bun install && bun run build
Build output directory: dist
Root directory: (leave empty)
```

### Environment Variables (Optional)

You may need to set these in the Cloudflare Pages dashboard:

- `BUN_VERSION`: `latest` (if Bun is not available by default)
- `NODE_VERSION`: `18` (fallback if Bun is not supported)

Note: As of 2024, Cloudflare Pages may not have native Bun support. In that case, you can:

1. **Pre-build locally** and deploy the `dist/` folder directly
2. **Use Node.js** in the build environment (the bundled output works with any static host)

## Custom Domain

After deployment:

1. Go to your Pages project settings
2. Click "Custom domains"
3. Add your domain
4. Update your DNS records as instructed

## Troubleshooting

### Build fails on Cloudflare Pages

If Bun is not available in the Cloudflare build environment:

1. **Build locally**:
   ```bash
   bun run build
   ```

2. **Deploy the dist folder**:
   ```bash
   wrangler pages deploy dist
   ```

### Game doesn't load

- Check browser console for errors
- Ensure `dist/game.js` and `dist/index.html` exist
- Verify the build completed successfully

### Performance issues

The bundled `game.js` is ~5.5MB. For better performance:

- Enable Cloudflare's compression (Brotli/Gzip)
- Use Cloudflare's CDN caching
- Consider code splitting if needed (advanced)

## Continuous Deployment

Once connected to Git, Cloudflare Pages will automatically:
- Build and deploy on every push to `main`
- Create preview deployments for pull requests
- Provide deployment history and rollback options

## Local Testing

Before deploying, test locally:

```bash
bun run build
bun run preview
```

Open http://localhost:8080 to test the built version.
