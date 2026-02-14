# Crash Kart 🏎️

A 3D car racing sandbox game built with Babylon.js and Bun.

## Features

- Drive multiple cars around a stadium-style race track
- Steal other cars by getting close and pressing F
- Arcade-style physics
- Beautiful 3D graphics with Babylon.js

## Development

### Prerequisites

- [Bun](https://bun.sh) installed on your system

### Install Dependencies

```bash
bun install
```

### Build

```bash
bun run build
```

This will bundle the game into the `dist/` directory.

### Preview Locally

```bash
bun run preview
```

Then open http://localhost:8080 in your browser.

## Deploy to Cloudflare Pages

### Option 1: Using Cloudflare Pages Dashboard

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Click "Create a project"
4. Connect your Git repository
5. Configure build settings:
   - **Build command**: `bun install && bun run build`
   - **Build output directory**: `dist`
   - **Root directory**: (leave empty or set to `/`)
6. Click "Save and Deploy"

### Option 2: Using Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist
```

### Option 3: Direct Upload

After building:

```bash
bun run build
```

You can manually upload the `dist/` folder contents to Cloudflare Pages.

## Controls

- **W / ↑**: Accelerate
- **S / ↓**: Brake / Reverse
- **A / ←**: Steer Left
- **D / →**: Steer Right
- **F**: Enter/Exit Car (steal nearby cars)

## Project Structure

```
crash-kart/
├── src/
│   └── game.js          # Main game code (ES modules)
├── dist/                # Built output (generated)
│   ├── index.html
│   └── game.js          # Bundled JavaScript
├── package.json         # Dependencies and scripts
├── wrangler.toml        # Cloudflare Pages configuration
└── README.md
```

## Technologies

- [Babylon.js](https://www.babylonjs.com/) - 3D engine
- [Cannon.js](https://schteppe.github.io/cannon.js/) - Physics engine
- [Bun](https://bun.sh) - JavaScript runtime and bundler
- [Cloudflare Pages](https://pages.cloudflare.com/) - Deployment platform

## License

MIT
