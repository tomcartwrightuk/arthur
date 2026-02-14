# Quick Start Guide

## 🚀 Deploy to Cloudflare Pages in 5 Minutes

### Prerequisites
- [Bun](https://bun.sh) installed
- A Cloudflare account (free tier works!)

### Step 1: Build
```bash
cd /home/tom/code/arthur/crash-kart
bun install
bun run build
```

### Step 2: Test Locally (Optional)
```bash
bun run preview
# Open http://localhost:8080
```

### Step 3: Deploy

#### Option A: Via GitHub (Recommended)
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Crash Kart game ready for deployment"

# Push to GitHub
git remote add origin <your-github-repo-url>
git push -u origin main
```

Then:
1. Go to https://dash.cloudflare.com/
2. Navigate to "Workers & Pages" → "Pages"
3. Click "Create application" → "Connect to Git"
4. Select your repository
5. Build settings:
   - **Build command**: `bun install && bun run build`
   - **Build output directory**: `dist`
6. Click "Save and Deploy"

#### Option B: Direct Deploy with Wrangler
```bash
# Install wrangler if needed
npm install -g wrangler

# Login
wrangler login

# Deploy
bun run deploy
```

### Step 4: Play! 🎮

Your game will be live at:
- `https://crash-kart.pages.dev` (default)
- Or your custom domain

## Commands Reference

```bash
bun install          # Install dependencies
bun run build        # Build for production
bun run dev          # Build with watch mode
bun run preview      # Test locally
bun run deploy       # Build and deploy
```

## Troubleshooting

**Build fails?**
- Make sure Bun is installed: `bun --version`
- Try: `rm -rf node_modules bun.lock && bun install`

**Game doesn't load?**
- Check browser console for errors
- Verify dist/game.js and dist/index.html exist
- Try rebuilding: `bun run build`

**Deployment fails?**
- If Cloudflare doesn't support Bun yet, build locally and deploy the dist folder
- Use: `wrangler pages deploy dist`

## Game Controls

- **W / ↑**: Accelerate
- **S / ↓**: Brake / Reverse  
- **A / ←**: Steer Left
- **D / →**: Steer Right
- **F**: Steal nearby cars

## What's Included

✅ Full game source code with ES modules  
✅ Babylon.js 3D engine  
✅ Cannon.js physics  
✅ Bun build system  
✅ Cloudflare Pages configuration  
✅ Deployment scripts  

## Need Help?

- See [README.md](README.md) for full documentation
- See [DEPLOY.md](DEPLOY.md) for detailed deployment guide
- See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for technical details

---

**Ready to race!** 🏁
