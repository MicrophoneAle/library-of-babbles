# Library of Babbles

A long-term personal website built as a navigable 3D library. The current milestone is a first-person lobby: walk around a textured GLB room with Rapier physics, pointer-lock look, and WASD movement.

**Live:** [library-of-babbles.vercel.app](https://library-of-babbles.vercel.app)

## Current status

- **Active app:** Vite + React 19 + React Three Fiber (`src/App.tsx`)
- **Lobby asset:** `public/assets/lobby/room_lobby_textured_walls.glb` (~116 MB, PBR wood textures) — floor, mezzanine, stairs, columns, lectern, and baseboards with colliders
- **Fallback asset:** `public/assets/lobby/room_lobby.glb` (~40 MB, untextured) — lighter option for local dev
- **Player:** Kinematic character controller with custom gravity, autostep, speed modes (slow / walk / fast), and a narrow capsule hitbox (0.4 m wide)
- **Camera:** 55° vertical FOV for a natural view without wide-angle edge distortion
- **HUD:** Crosshair, on-screen arrow keys, and speed indicator (C / V)
- **Loading:** Streamed download progress (0–100%) with parsing phase; error boundary for failed loads
- **Deploy:** Vercel (production build via `npm run build`)
- **Backend scaffold:** Express ABEL proxy in `server/` (not wired to the frontend yet)
- **Legacy / planned:** Next.js-era components in `src/components/`, Supabase schema in `supabase/` (not connected to the 3D app yet)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 6, React 19, TypeScript, Tailwind CSS |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier` |
| State | Zustand (`gameStore`, `lobbyLoadStore`) |
| Assets | Git LFS for lobby GLBs |
| Data (planned) | Supabase / PostgreSQL |
| API (planned) | Express proxy in `server/` |

## Local setup

### Prerequisites

Lobby GLBs are tracked with **Git LFS**. After cloning:

```bash
git lfs install
git lfs pull
```

Without LFS, the browser receives pointer files instead of real models and the lobby will fail to load.

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
| W / A / S / D or arrow keys | Move |
| C | Slower (walk → slow) |
| V | Faster (walk → fast) |
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

## Deployment (Vercel)

1. Connect the GitHub repo to Vercel.
2. In **Project → Settings → Git**, enable **Git Large File Storage (LFS)**.
3. Redeploy after enabling LFS so Vercel pulls the real GLB blobs (not LFS pointer text).

If the lobby fails with a JSON parse error mentioning `version https://git-lfs…`, LFS is not enabled or the asset was not pulled.

## Project layout

```
src/
  App.tsx                 # Canvas, lobby room, player physics, HUD
  main.tsx                # Vite entry
  hooks/useLobbyGLTF.ts   # Streamed GLB fetch + parse with progress
  store/
    gameStore.ts          # Spawn, speed mode, floor height
    lobbyLoadStore.ts     # Download progress state
  components/             # Legacy Next.js UI (not used by 3D app yet)
  lib/                    # Supabase helpers, sample books
public/
  assets/lobby/           # Lobby GLBs (Git LFS)
server/                   # Express ABEL proxy
supabase/                 # SQL schema + seed
scripts/
  inspect-glb.mjs         # Dump GLB node hierarchy and mesh bounds
```

## Lobby loading & large assets

The textured lobby is loaded via a custom fetch pipeline (`useLobbyGLTF`) rather than cloning the scene in memory:

- **No full-scene clone** — the loaded GLB is used in place; colliders are geometry-only bakes
- **Texture downscale** — embedded maps larger than 2048 px are resized on load to reduce GPU memory use
- **Progress** — byte-streamed download (0–92%), parse phase (92–100%), brief hold at 100% before the room appears
- **Errors** — a React error boundary surfaces load failures (including LFS pointer mistakes) instead of a silent black screen

To switch back to the lighter untextured room for faster iteration, change `LOBBY_GLB` in `src/App.tsx`:

```ts
const LOBBY_GLB = "/assets/lobby/room_lobby.glb";
```

## Lobby physics notes

The lobby GLB is loaded in its authored orientation (no corrective flip). Floor height and spawn placement are derived from `Lobby_Floor_Walls` bounds. The player spawns on the ground floor near the −Z wall, facing +Z toward the stairs / elevated floor.

Static trimesh colliders (stairs, elevated floor, walls, columns, baseboards, lectern) use invisible geometry-only meshes with `includeInvisible` on the `RigidBody`, because Rapier skips `visible={false}` meshes by default. Stair ascent is handled by character-controller autostep tuning (not a separate ramp collider).

To inspect the GLB offline:

```bash
node scripts/inspect-glb.mjs public/assets/lobby/room_lobby_textured_walls.glb
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
- Move large production assets to Cloudflare R2 when multiple rooms exceed Git LFS comfort
- Wire Supabase books/data into the 3D experience
- Connect ABEL proxy to in-world interactions
- Post-processing, audio, and richer lobby content
