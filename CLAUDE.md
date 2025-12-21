# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website featuring a 3D immersive experience built with Next.js 14. The application showcases projects, blog posts, and professional information with Three.js-powered visualizations.

## Build & Development Commands

All commands should be run from the frontend directory: `src/AR/AR.Web/AR.Web.Fe/`

```bash
npm run dev       # Start development server on localhost:3000
npm run build     # Create production build
npm start         # Run production server
npm run lint      # Run ESLint (Next.js core-web-vitals rules)
```

## Architecture

### Technology Stack
- **Frontend:** Next.js 14.1.0 with React 18, TypeScript 5
- **3D Graphics:** Three.js + React Three Fiber for immersive landing page
- **UI:** Material-UI (MUI) 5.15 with Emotion CSS-in-JS
- **Data:** Firebase Realtime Database for projects and blog posts
- **Analytics:** PostHog for user tracking

### Widget-Based Component Structure
Components follow a consistent pattern in `src/widgets/`:
```
Widget/
├── ui/           # Visual/presentational components
├── models/       # TypeScript interfaces
├── styled/       # Emotion styled components
├── assets/       # Local static resources
└── index.ts      # Barrel exports
```

### Key Directories
- `src/pages/` - Next.js page routes (index, blog, projects, explore)
- `src/widgets/` - Reusable widget components (IndexScene, Blog, Projects, Explore, Layout, NavigationMenu)
- `src/app/` - App configuration (theme.ts, firebase.ts, constants.ts)
- `public/models/` - 3D GLTF models for the landing page scene

### Data Flow
1. **Home page** (`/`) - Interactive 3D scene with React Three Fiber canvas
2. **Firebase integration** - Projects fetched from `/projects`, blogs from `/blogs` with ordering
3. **Analytics** - PostHog tracks page views via router events

### Page Structure
- `/` - 3D landing page with animated desk/laptop scene
- `/explore` - About section with professional info card and social links
- `/projects` - Firebase-backed project gallery with modal details view
- `/blog` - Blog listing table with dynamic routing to `/blog/[src]`

## Code Style

Prettier configuration (`.prettierrc`):
- 4-space tabs
- No semicolons
- Single quotes
- ES5 trailing commas

## Deployment

### Docker
Multi-stage build defined in `src/AR/AR.Web/AR.Web.Fe/Dockerfile`:
- Build args: `DEPLOY_ENV`, `POSTHOG_HOST`, `POSTHOG_KEY`
- Production image runs as non-root user on port 3000

### Kubernetes
Manifests in `k8s/` deploy to namespace `ar-web-namespace`:
- Deployment, Service (NodePort 80->3000), Ingress
- Domain: `${DEPLOY_ENV}.aleksaristic.com`
- Environment variable substitution via `envsubst`

### CI/CD (GitHub Actions)
- `build-and-publish-web-fe.yml` - Builds and pushes Docker image
- `deploy-aleksaristic-web-fe.yml` - Applies K8s manifests and restarts deployment

## Important Notes

- **PC-only design:** Site displays mobile warning message on smaller viewports
- **Firebase config:** Client-side Firebase (standard pattern, relies on Firebase security rules)
- **3D models:** GLTF files loaded dynamically via GLTFLoader
- **MUI Grid:** Uses `Unstable_Grid2` for layout flexibility
