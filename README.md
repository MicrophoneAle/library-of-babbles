# Library of Babbles

A long-term personal website built as a navigable 3D library. The current milestone is a first-person lobby greybox: walk around a GLB room with Rapier physics, pointer-lock look, and WASD movement.

## Current status

- **Active app:** Vite + React 19 + React Three Fiber (`src/App.tsx`)
- **Lobby:** `public/assets/lobby/room_lobby.glb` — floor, elevated mezzanine, and stairs with colliders
- **Player:** Kinematic character controller with custom gravity, autostep, and a narrow capsule hitbox (0.4 m wide)
- **Backend scaffold:** Express ABEL proxy in `server/` (not wired to the frontend yet)
- **Legacy / planned:** Next.js-era components in `src/components/`, Supabase schema in `supabase/` (not connected to the 3D app yet)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 6, React 19, TypeScript |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier` |
| State | Zustand (`src/store/gameStore.ts`) |
| Data (planned) | Supabase / PostgreSQL |
| API (planned) | Express proxy in `server/` |

## Local setup

### Frontend

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Click the canvas to lock the pointer.

**Controls**

| Input | Action |
|-------|--------|
| Click canvas | Pointer lock (mouse look) |
| W / A / S / D | Move |
| Mouse | Look around |

### ABEL proxy (optional)

```bash
cd server
npm install
npm start
```

Runs on port `3001` with `GET /health` and a placeholder `POST /api/abel`.

### Environment variables

Copy `.env.example` to `.env.local` and set Supabase keys when wiring up the books/data layer:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Project layout

```
src/
  App.tsx              # Canvas, lobby room, player physics
  main.tsx             # Vite entry
  store/gameStore.ts   # spawn point, room state
  components/          # Legacy Next.js UI (not used by 3D app yet)
  lib/                 # Supabase helpers, sample books
public/
  assets/lobby/        # Active lobby GLB
server/                # Express ABEL proxy
supabase/              # SQL schema + seed
scripts/
  inspect-glb.mjs      # Dump GLB node hierarchy and mesh bounds
```

## Lobby physics notes

The lobby GLB is loaded in its authored orientation (no corrective flip). Floor height and spawn placement are derived from `Lobby_Floor_Walls` bounds. The player spawns on the ground floor near the −Z wall, facing +Z toward the stairs / elevated floor.

Static colliders: the elevated floor uses a trimesh; the stair flight uses an invisible ramp cuboid (~30°) so the character controller walks it as a continuous slope instead of discrete tall risers.

To inspect the GLB offline:

```bash
node scripts/inspect-glb.mjs public/assets/lobby/room_lobby.glb
```

Enable Rapier debug wireframes by adding the `debug` prop to `<Physics>` in `src/App.tsx`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Roadmap (short)

- Clean Blender export pipeline (`SPAWN_*`, `COL_*` markers, corrected normals)
- Room transitions and additional wings
- Wire Supabase books/data into the 3D experience
- Connect ABEL proxy to in-world interactions
- Post-processing, audio, and richer lobby content
