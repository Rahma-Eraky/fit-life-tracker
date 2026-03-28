# Workspace

## Overview

FitTrack - A full-stack fitness and nutrition web application built with React + Vite (frontend) and Express (backend), using PostgreSQL for persistence.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, Recharts
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── fitness-app/        # React + Vite frontend (previewPath: /)
│   └── api-server/         # Express API server (previewPath: /api)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seed script
```

## Application Features

### Pages
- **Homepage** (`/`) - Hero section, navigation, feature highlights
- **Workouts** (`/workouts`) - Category/difficulty filters, workout cards, mark complete, calories/duration
- **Nutrition** (`/nutrition`) - Meal plans by goal, recipe cards with macros, food diary
- **Blog** (`/blog`) - Articles with search, save favorites
- **Profile** (`/profile`) - User info, progress chart, editable profile, achievements

### Backend Routes (`/api`)
- `GET/POST /api/workouts` - Workout listing and filtering
- `POST /api/workouts/:id/complete` - Mark complete, earn 50 points
- `GET /api/meals` - Meal/recipe listing with goal filter
- `GET/POST /api/meals/diary` - Food diary management
- `GET /api/blog` - Blog article listing
- `POST /api/blog/:id/favorite` - Toggle favorites
- `GET/PUT /api/profile` - Profile read/update
- `GET /api/progress` - Progress stats with weekly breakdown

### Gamification
- Users earn 50 points per completed workout
- Level system (level = points / 500 + 1)
- Achievements unlocked based on activity

## Database Schema

- `workouts` - Workout catalog
- `meals` - Recipe/meal catalog
- `diary_entries` - Daily food diary
- `articles` - Blog articles
- `profile` - Single user profile

## Development Commands

- `pnpm --filter @workspace/fitness-app run dev` - Start frontend
- `pnpm --filter @workspace/api-server run dev` - Start backend
- `pnpm --filter @workspace/db run push` - Push schema changes
- `pnpm --filter @workspace/scripts run seed` - Seed database
- `pnpm --filter @workspace/api-spec run codegen` - Regenerate API client
