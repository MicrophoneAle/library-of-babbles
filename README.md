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

## Lobby layout & objects

The lobby is a rectangular hall (~20 m wide × ~30 m deep) with dark wood PBR textures (textured asset) or grey placeholder materials (fallback asset). Both GLBs share the same node hierarchy.

### Top-down layout (+Z = toward stairs / mezzanine)

```
                    +Z (stairs, elevated floor)
                           ↑ spawn faces this way
    ┌──────────────────────────────────────────┐
    │  Upper_Short_Column_2    Upper_Short_Column_1  │  ← short columns (+Z wall)
    │         │                          │           │
    │  Lower_Short_Column_2    Lower_Short_Column_1  │
    │                                            │
    │  Tall_Column_4              Tall_Column_3    │  ← mid-room (z ≈ 0)
    │         │                          │           │
    │              [ LECTERN ]                   │  ← center, ground floor
    │         │                          │           │
    │  Tall_Column_2              Tall_Column_1    │  ← rear (z ≈ −15)
    │                                            │
    │         ★ SPAWN (near −Z wall)           │
    └──────────────────────────────────────────┘
                    −Z (entry / back wall)
         ← −X                              +X →
```

### Scene objects

| Node | Type | Location / role |
|------|------|-----------------|
| `Lobby_Floor_Walls` | Mesh | Main shell — ground floor, walls, and ceiling (~20 × 30 m footprint) |
| `Lobby_Elevated_Floor` | Mesh | Mezzanine / balcony deck at the **+Z** end, above the ground floor |
| `Lobby_Stairs` / `Lobby_Stairs.001` | Mesh | Grand curved staircase connecting ground floor to the mezzanine (inside `Sketchfab_model`, re-parented at runtime as `Lobby_Stairs_Visual`) |
| `Tall_Column_1` … `Tall_Column_4` | Mesh | Four full-height fluted columns at the mid-room corners (±7.5 m on X, z ≈ −15 and 0) |
| `Upper_Short_Column_1/2` | Mesh | Upper halves of short columns on the **+Z** wall (y ≈ 11.5 m) |
| `Lower_Short_Column_1/2` | Mesh | Lower halves of short columns on the **+Z** wall (y ≈ 3.5 m) |
| `Ground_Baseboards` | Mesh | Perimeter baseboard / trim along the walls |
| `Sketchfab_model.001` → lectern mesh | Mesh | Ornate wooden **lectern** on the ground floor, roughly centered |
| `lectern_HP` … `lectern_HP8` | Empty nodes | Hotspot stubs reserved for future lectern interaction (no visible geometry) |
| `MirrorPoint_Lobby` | Empty node | Authoring reference point |
| `Object_4` | Empty node | Unused stub |
| `Sketchfab_model` | Group (hidden) | Original Sketchfab import for stairs; hidden at runtime, stairs extracted for display + colliders |

### Player spawn & orientation

- **Spawn:** Ground floor, near the **−Z** back wall (2.5 m inset from the wall edge), centered on X
- **Facing:** **+Z** — toward the lectern, stairs, and elevated floor
- **Eye height:** 1.6 m (capsule-based first-person camera)

### Colliders (physics)

| Target | Collider type |
|--------|---------------|
| Ground floor | Cuboid under `Lobby_Floor_Walls` bounds |
| Walls & ceiling | Trimesh from `Lobby_Floor_Walls` |
| Elevated floor | Trimesh from `Lobby_Elevated_Floor` |
| Stairs | Trimesh from `Lobby_Stairs.001` |
| Columns (`*Column*`, `Cylinder*`) | Trimesh per column |
| Baseboards (`Ground_Baseboards`, `Vert*`, name matches `baseboard/trim/plinth`) | Trimesh + perimeter cuboid fallback |
| Lectern (`Sketchfab_model.001`) | World-baked trimesh + padded cuboid fallback |

Stair climbing uses Rapier character-controller **autostep** (no separate ramp collider).

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

The lobby GLB is loaded in its authored orientation (no corrective flip). Floor height and spawn placement are derived from `Lobby_Floor_Walls` bounds.

Static trimesh colliders use invisible geometry-only meshes with `includeInvisible` on the `RigidBody`, because Rapier skips `visible={false}` meshes by default. See **Colliders** in [Lobby layout & objects](#lobby-layout--objects) above for the full list.

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
