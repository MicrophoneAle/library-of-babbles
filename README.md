# Library of Babbles

A long-term personal website built as a navigable 3D library. The current milestone is a first-person lobby: walk (and jump) around a detailed GLB room with Rapier physics, pointer-lock look, interactable props, and speed modes up to sprint.

**Live:** [library-of-babbles.vercel.app](https://library-of-babbles.vercel.app)

## Current status

- **Active app:** Vite + React 19 + React Three Fiber (`src/App.tsx`)
- **Lobby asset:** `public/assets/lobby/room_lobby.glb` — floor, mezzanine, stairs, columns, lectern, **reception desk**, and baseboards with colliders
- **Alternate asset:** `public/assets/lobby/room_lobby_textured_walls.glb` — heavier PBR-textured variant (not the default `LOBBY_GLB`)
- **Player:** Kinematic character controller with custom gravity, jump (Space), coyote time / jump buffer, autostep, and a tall capsule (~2.1 m, 0.4 m wide; eye height 2.4 m)
- **Speed modes:** Slow → Walk → **Fast (default)** → Sprint (C slower / V faster)
- **Camera:** 55° vertical FOV for a natural view without wide-angle edge distortion
- **Interactions:** World prompts (F) on the lectern and reception desk — head-tracked billboards, focus by proximity + look direction, modal popups (Esc / Close)
- **HUD:** Crosshair, on-screen arrow keys + Space, speed indicator (C / V)
- **Loading:** Streamed download progress (0–100%) with parsing phase; error boundary for failed loads
- **Deploy:** Vercel (production build via `npm run build`)
- **Backend scaffold:** Express ABEL proxy in `server/` (not wired to the frontend yet)
- **Legacy / planned:** Next.js-era components in `src/components/`, Supabase schema in `supabase/` (not connected to the 3D app yet)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite 6, React 19, TypeScript, Tailwind CSS |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier` |
| State | Zustand (`gameStore`, `lobbyLoadStore`, `interactStore`) |
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
| Space | Jump (grounded; works on stairs via coyote time + jump buffer) |
| C | One speed step slower |
| V | One speed step faster |
| F | Interact (when a world prompt is focused) |
| Esc | Close open popup / release pointer as usual |
| Mouse | Look around |

**Speed tiers** (default: **Fast**)

| Mode | Approx. speed | HUD label |
|------|---------------|-----------|
| Slow | 1.75 m/s | SLOW |
| Medium | 3.5 m/s | WALK |
| Fast | 5.5 m/s | FAST |
| Sprint | 8.5 m/s | SPRINT |

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
  App.tsx                      # Canvas, lobby room, player physics, HUD
  main.tsx                     # Vite entry
  hooks/useLobbyGLTF.ts        # Streamed GLB fetch + parse with progress
  store/
    gameStore.ts               # Spawn, speed, floor height, interact anchors
    lobbyLoadStore.ts          # Download progress state
    interactStore.ts           # Prompt focus + popup routing
  types/interactPrompt.ts      # Shared prompt definition + createInteractPrompt
  config/interactPrompts.ts    # Lectern + reception desk prompt configs
  components/
    interact/WorldInteractPrompt.tsx   # Reusable F-prompt (head-tracked)
    lobby/LecternPopup.tsx             # Lectern welcome modal
    lobby/ReceptionDeskPopup.tsx       # Reception desk modal
  lib/                         # Supabase helpers, sample books
public/
  assets/lobby/                # Lobby GLBs (Git LFS)
server/                        # Express ABEL proxy
supabase/                      # SQL schema + seed
scripts/
  inspect-glb.mjs              # Dump GLB node hierarchy and mesh bounds
```

## Lobby layout & objects

The lobby is a rectangular hall (~20 m wide × ~35 m deep) with a ground floor, grand stairs, and a mezzanine (+Z) that holds the reception desk. The active GLB is `room_lobby.glb`.

### Top-down layout (+Z = toward stairs / mezzanine)

```
                    +Z (stairs → elevated floor + reception)
                           ↑ spawn faces this way
    ┌──────────────────────────────────────────┐
    │  Upper_Short_Column_2    Upper_Short_Column_1  │  ← short columns (+Z wall)
    │         │                          │           │
    │  Lower_Short_Column_2    Lower_Short_Column_1  │
    │                                            │
    │         [ RECEPTION DESK ]  (mezzanine)    │  ← circular loop counter
    │                                            │
    │  Tall_Column_4              Tall_Column_3    │  ← mid-room (z ≈ 0)
    │         │                          │           │
    │              [ LECTERN ]                   │  ← ground floor, toward −Z
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
| `Lobby_Floor_Walls` | Mesh | Main shell — ground floor, walls, and ceiling (~20 × 35 m footprint) |
| `Lobby_Elevated_Floor` | Mesh | Mezzanine / balcony deck at the **+Z** end |
| `Lobby_Stairs` / `Lobby_Stairs.001` | Mesh | Grand staircase from ground floor to the mezzanine (extracted at runtime as `Lobby_Stairs_Visual`) |
| `Reception_Desk_Lobby` | Mesh | Merged **reception desk** on the mezzanine — circular loop with an opening at the back; walkable inside |
| `Tall_Column_1` … `Tall_Column_4` | Mesh | Four full-height fluted columns at the mid-room corners |
| `Upper_Short_Column_1/2` | Mesh | Upper halves of short columns on the **+Z** wall |
| `Lower_Short_Column_1/2` | Mesh | Lower halves of short columns on the **+Z** wall |
| `Ground_Baseboards` | Mesh | Perimeter baseboard / trim along the walls |
| `Sketchfab_model.001` → lectern mesh | Mesh | Ornate wooden **lectern** on the ground floor (near −Z center) |
| `lectern_HP` … `lectern_HP8` | Empty nodes | Hotspot stubs under the lectern hierarchy |
| `MirrorPoint_Lobby` | Empty node | Authoring reference point |
| `Sketchfab_model` / `.002` | Group (hidden) | Stairs import roots; hidden at runtime after stairs are extracted |
| `Sketchfab_model.003` / `.004` | Group | Import wrappers; desk mesh lives under `.004` as `Reception_Desk_Lobby` |

### Player spawn, view & avatar

- **Spawn:** Ground floor, near the **−Z** back wall (2.5 m inset), centered on X
- **Facing:** **+Z** — toward the lectern, stairs, mezzanine, and reception desk
- **Eye height:** 2.4 m (1.5× the original first-person height)
- **Capsule:** ~2.1 m tall × 0.4 m wide
- **FOV:** 55° vertical

### Interactions

Reusable world prompts (`WorldInteractPrompt` + `createInteractPrompt`):

| Target | Prompt id | Anchor | Behavior |
|--------|-----------|--------|----------|
| Lectern | `lobby-lectern` | Just above lectern top | F opens welcome popup |
| Reception desk | `lobby-reception-desk` | Above the visitor-facing front of the counter | F opens reception popup |

Prompts:

- Appear when in range and looking toward the anchor
- **Track the camera/head** by default (`trackHead: true`) — pitch and yaw to face the player
- Share focus (closest eligible prompt wins) via `interactStore`

### Colliders (physics)

| Target | Collider type |
|--------|---------------|
| Ground floor | Cuboid under `Lobby_Floor_Walls` bounds |
| Walls & ceiling | Trimesh from `Lobby_Floor_Walls` |
| Elevated floor | Trimesh from `Lobby_Elevated_Floor` |
| Stairs | Trimesh from `Lobby_Stairs.001` |
| Reception desk (`Reception_Desk_Lobby`) | **Trimesh only** (hollow loop stays walkable; no solid AABB) |
| Columns (`*Column*`, `Cylinder*`) | Trimesh per column |
| Baseboards (`Ground_Baseboards`, `Vert*`, name matches `baseboard/trim/plinth`) | Trimesh + perimeter cuboid fallback |
| Lectern (`Sketchfab_model.001`) | World-baked trimesh + padded cuboid fallback |

Stair climbing uses Rapier character-controller **autostep**. Jumping uses Space with coyote time and a short input buffer so stairs remain reliable.

## Lobby loading & large assets

The lobby is loaded via a custom fetch pipeline (`useLobbyGLTF`) rather than cloning the scene in memory:

- **No full-scene clone** — the loaded GLB is used in place; colliders are geometry-only bakes
- **Texture downscale** — embedded maps larger than 2048 px are resized on load to reduce GPU memory use
- **Progress** — byte-streamed download (0–92%), parse phase (92–100%), brief hold at 100% before the room appears
- **Errors** — a React error boundary surfaces load failures (including LFS pointer mistakes) instead of a silent black screen

To try the alternate textured room, change `LOBBY_GLB` in `src/App.tsx`:

```ts
const LOBBY_GLB = "/assets/lobby/room_lobby_textured_walls.glb";
```

## Lobby physics notes

The lobby GLB is loaded in its authored orientation (no corrective flip). Floor height and spawn placement are derived from `Lobby_Floor_Walls` bounds.

Static trimesh colliders use invisible geometry-only meshes with `includeInvisible` on the `RigidBody`, because Rapier skips `visible={false}` meshes by default. See **Colliders** in [Lobby layout & objects](#lobby-layout--objects) above for the full list.

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
- Richer reception / lectern content and more interactables
- Move large production assets to Cloudflare R2 when multiple rooms exceed Git LFS comfort
- Wire Supabase books/data into the 3D experience
- Connect ABEL proxy to in-world interactions
- Post-processing, audio, and richer lobby content
