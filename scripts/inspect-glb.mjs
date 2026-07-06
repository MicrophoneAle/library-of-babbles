// Quick GLB structure dump: node names, mesh bounds (from accessor min/max).
// Usage: node scripts/inspect-glb.mjs public/assets/lobby/room_lobby.glb
import { readFileSync } from "node:fs";

const path = process.argv[2] ?? "public/assets/lobby/room_lobby.glb";
const buf = readFileSync(path);

const jsonLength = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString("utf8"));

const { nodes = [], meshes = [], accessors = [], scenes = [] } = json;

function meshBounds(meshIndex) {
  const mesh = meshes[meshIndex];
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const prim of mesh.primitives ?? []) {
    const acc = accessors[prim.attributes?.POSITION];
    if (!acc?.min || !acc?.max) continue;
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], acc.min[i]);
      max[i] = Math.max(max[i], acc.max[i]);
    }
  }
  return { min, max };
}

function fmt(v) {
  return `[${v.map((n) => Number(n.toFixed(3))).join(", ")}]`;
}

function walk(nodeIndex, depth) {
  const node = nodes[nodeIndex];
  const pad = "  ".repeat(depth);
  const parts = [`${pad}${node.name ?? `#${nodeIndex}`}`];
  if (node.translation) parts.push(`t=${fmt(node.translation)}`);
  if (node.rotation) parts.push(`r=${fmt(node.rotation)}`);
  if (node.scale) parts.push(`s=${fmt(node.scale)}`);
  if (node.mesh !== undefined) {
    const { min, max } = meshBounds(node.mesh);
    parts.push(`mesh bounds min=${fmt(min)} max=${fmt(max)}`);
  }
  console.log(parts.join("  "));
  for (const child of node.children ?? []) walk(child, depth + 1);
}

for (const scene of scenes) {
  for (const root of scene.nodes ?? []) walk(root, 0);
}
