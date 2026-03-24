# Lobby Asset Guide

Drop replacement files in this folder using these exact names:

- `room-shell.webp` - full lobby shell (walls + general lighting)
- `glass-dome.webp` - flattened top skylight / glass dome area
- `wall-shelves.webp` - bookshelf-heavy wall layer
- `floor-planks.webp` - dark wood floor layer
- `furniture-center.webp` - center furniture/lectern layer

The lobby renderer reads these paths from:

- `src/config/lobbyScene.ts`

To change layout and interaction zones:

- **Layer position/sizing:** edit `className` in `lobbyLayers`
- **Clickable areas:** edit `className`, `href`, `label` in `lobbyHotspots`

Recommended export specs:

- Room/floor layers: 2200-3200 px wide
- Smaller overlays (dome/furniture): 1200-2000 px wide
- Prefer `.webp` for size and quality balance
