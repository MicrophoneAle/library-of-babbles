import { Environment, Html, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  CuboidCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";
import { Suspense, Component, useEffect, useMemo, useRef, useState } from "react";
import type { KinematicCharacterController } from "@dimforge/rapier3d-compat";
import {
  Box3,
  DoubleSide,
  Group,
  Mesh,
  Object3D,
  Quaternion,
  Texture,
  Vector3,
  type BufferGeometry,
  type Material,
} from "three";

import { LecternPopup } from "./components/lobby/LecternPopup";
import { ReceptionDeskPopup } from "./components/lobby/ReceptionDeskPopup";
import { WorldInteractPrompt } from "./components/interact/WorldInteractPrompt";
import {
  LECTERN_INTERACT_PROMPT,
  RECEPTION_DESK_INTERACT_PROMPT,
} from "./config/interactPrompts";
import { useGameStore, type MoveSpeedMode } from "./store/gameStore";
import { useLobbyGLTF } from "./hooks/useLobbyGLTF";
import { useLobbyLoadStore } from "./store/lobbyLoadStore";

const LOBBY_GLB = "/assets/lobby/room_lobby.glb";

const MOVE_SPEED_SLOW = 1.75;
const MOVE_SPEED_MEDIUM = 3.5;
const MOVE_SPEED_FAST = 5.5;
const MOVE_SPEED_BY_MODE = {
  slow: MOVE_SPEED_SLOW,
  medium: MOVE_SPEED_MEDIUM,
  fast: MOVE_SPEED_FAST,
} as const;
const GRAVITY = -39.24; // ~4× Earth — snappy falls, less float off ledges/stairs
const TERMINAL_VELOCITY = -28;
const JUMP_VELOCITY = 12; // ~1.8 m peak height with current gravity
/** Allow jump shortly after leaving ground (helps on stairs / autostep). */
const COYOTE_TIME = 0.14;
/** Remember Space for a short window so brief ungrounded frames don't eat the press. */
const JUMP_BUFFER_TIME = 0.12;
const SNAP_TO_GROUND = 0.25;
// Tuned for one tall stair riser — high enough to clear steps, low enough to
// avoid leaping several at once and jamming.
const AUTO_STEP_MAX_HEIGHT = 1.0;
const AUTO_STEP_MIN_WIDTH = 0.08;
const CHARACTER_OFFSET = 0.04;
const MAX_SLOPE_CLIMB_DEG = 60;
// Avatar is 1.5× the original 1.4 m capsule (eye was 1.6 m).
const STANDING_EYE_HEIGHT = 2.4;
// Total capsule height = 2 * (half height + radius) = 2.1 m, 0.4 m wide.
const CAPSULE_HALF_HEIGHT = 0.85;
const CAPSULE_RADIUS = 0.2;
const CAPSULE_BOTTOM_OFFSET = CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS;
const LOOK_SENSITIVITY = 0.002;
// Vertical FOV in degrees — lower values reduce edge stretching (75° feels lens-like).
const CAMERA_FOV = 55;

function useKeyboard() {
  const keys = useRef({
    forward: false,
    back: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const setDirection = (code: string, value: boolean) => {
      switch (code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = value;
          return true;
        case "KeyS":
        case "ArrowDown":
          keys.current.back = value;
          return true;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = value;
          return true;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = value;
          return true;
        default:
          return false;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (setDirection(event.code, true) && event.code.startsWith("Arrow")) {
        event.preventDefault();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (setDirection(event.code, false) && event.code.startsWith("Arrow")) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return keys;
}

function findStairsNode(root: Object3D) {
  let best: Object3D | null = null;
  let bestScore = -1;

  root.traverse((object) => {
    const { name } = object;
    if (name === "Lobby_Stairs_Visual") {
      return;
    }
    if (
      name !== "Lobby_Stairs" &&
      name !== "Lobby_Stairs.001" &&
      name !== "Lobby_Stairs001" &&
      !/^Lobby_Stairs/i.test(name)
    ) {
      return;
    }

    let score = 0;
    const mesh = object as Mesh;
    if (mesh.isMesh) {
      score += 10;
    }
    // Prefer the concrete mesh import (e.g. Lobby_Stairs.001) over empty stubs.
    if (/\.001$|001$/.test(name)) {
      score += 5;
    }
    object.traverse((child) => {
      if (child !== object && (child as Mesh).isMesh) {
        score += 1;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      best = object;
    }
  });

  return best;
}

/** Geometry-only collider subtree — avoids duplicating 8K PBR textures. */
function cloneColliderSubtree(source: Object3D): Group {
  const group = new Group();
  group.name = `${source.name || "mesh"}_collider`;
  source.updateMatrixWorld(true);
  source.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh) {
      group.add(bakeMeshWorldGeometry(mesh));
    }
  });
  return group;
}

/** Visual-only clone for stairs extracted from the hidden Sketchfab hierarchy. */
function cloneVisualWithWorldTransform(source: Object3D) {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  source.matrixWorld.decompose(position, quaternion, scale);

  const clone = source.clone(true);
  clone.position.copy(position);
  clone.quaternion.copy(quaternion);
  clone.scale.copy(scale);
  clone.updateMatrixWorld(true);
  return clone;
}

function forceOpaqueMaterials(root: Object3D) {
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      material.transparent = false;
      material.opacity = 1;
      material.alphaTest = 0;
      material.depthWrite = true;
      material.side = DoubleSide;
      material.needsUpdate = true;
    }
  });
}

const TEXTURE_KEYS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
] as const;

/** Shrink embedded 8K maps so the textured lobby fits in GPU memory. */
function downscaleLargeTextures(root: Object3D, maxSize: number) {
  const seen = new Set<Texture>();
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material) {
        continue;
      }
      for (const key of TEXTURE_KEYS) {
        const texture = material[key as keyof Material] as Texture | undefined;
        if (!texture || seen.has(texture) || !texture.image) {
          continue;
        }
        seen.add(texture);
        const image = texture.image as { width?: number; height?: number };
        const width = image.width ?? 0;
        const height = image.height ?? 0;
        if (width <= maxSize && height <= maxSize) {
          continue;
        }
        const scale = maxSize / Math.max(width, height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          continue;
        }
        context.drawImage(image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
        texture.image = canvas;
        texture.needsUpdate = true;
      }
    }
  });
}

type PreparedRoom = {
  revision: number;
  room: Object3D;
  staticColliders: Group;
  floorBounds: Box3;
  baseboardBoxes: CuboidBox[];
  lecternBoxes: CuboidBox[];
  lecternColliders: Group;
  lecternInteractPoint: Vector3 | null;
  receptionDeskInteractPoint: Vector3 | null;
};

/** Bump when prepareRoomContent layout logic changes so WeakMap cache invalidates. */
const ROOM_PREPARE_REVISION = 22;

const preparedRooms = new WeakMap<Object3D, PreparedRoom>();

type CuboidBox = {
  args: [number, number, number];
  position: [number, number, number];
};

/** Solid frame of cuboids along the four walls. The Ground_Baseboards mesh AABB
 *  spans the entire floor, so a single box from it is useless for wall trim. */
function buildPerimeterBaseboardBoxes(
  floorBounds: Box3,
  height = 0.55,
  thickness = 0.45,
): CuboidBox[] {
  const min = floorBounds.min;
  const max = floorBounds.max;
  const cx = (min.x + max.x) * 0.5;
  const cz = (min.z + max.z) * 0.5;
  const cy = min.y + height * 0.5;
  const hx = Math.max((max.x - min.x) * 0.5, thickness);
  const hz = Math.max((max.z - min.z) * 0.5, thickness);
  const halfH = height * 0.5;
  const halfT = thickness * 0.5;

  return [
    { args: [hx, halfH, halfT], position: [cx, cy, min.z + halfT] },
    { args: [hx, halfH, halfT], position: [cx, cy, max.z - halfT] },
    { args: [halfT, halfH, hz], position: [min.x + halfT, cy, cz] },
    { args: [halfT, halfH, hz], position: [max.x - halfT, cy, cz] },
  ];
}

function boxFromObject(object: Object3D, minHalf = 0.25): CuboidBox | null {
  object.updateWorldMatrix(true, true);
  const box = new Box3().setFromObject(object);
  if (box.isEmpty()) {
    return null;
  }
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  return {
    args: [
      Math.max(size.x * 0.5, minHalf),
      Math.max(size.y * 0.5, minHalf),
      Math.max(size.z * 0.5, minHalf),
    ],
    position: [center.x, center.y, center.z],
  };
}

/** Bake a mesh's vertices into world space so colliders don't depend on
 *  decomposing nested non-uniform Sketchfab scales (which silently breaks). */
function bakeMeshWorldGeometry(mesh: Mesh): Mesh {
  mesh.updateWorldMatrix(true, false);
  const geometry = mesh.geometry.clone() as BufferGeometry;
  geometry.applyMatrix4(mesh.matrixWorld);
  if (geometry.attributes.position) {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  const baked = new Mesh(geometry);
  baked.name = `${mesh.name || "mesh"}_worldCollider`;
  baked.visible = false;
  baked.frustumCulled = false;
  return baked;
}

function prepareRoomContent(source: Object3D): PreparedRoom {
  const cached = preparedRooms.get(source);
  if (cached && cached.revision === ROOM_PREPARE_REVISION) {
    return cached;
  }

  source.updateMatrixWorld(true);
  downscaleLargeTextures(source, 2048);
  forceOpaqueMaterials(source);

  const staticColliders = new Group();

  // Stair meshes may live under Sketchfab_model or Sketchfab_model.002 (re-exports).
  // Prefer the best mesh in the whole room, then hide the import roots (not the lectern).
  const stairsSource = findStairsNode(source);
  if (stairsSource) {
    if (!source.getObjectByName("Lobby_Stairs_Visual")) {
      const stairs = cloneVisualWithWorldTransform(stairsSource);
      stairs.name = "Lobby_Stairs_Visual";
      forceOpaqueMaterials(stairs);
      source.add(stairs);
    }
    // Same as before: geometry-only trimesh for climbing via character autostep.
    staticColliders.add(cloneColliderSubtree(stairsSource));
  }

  for (const sketchfabName of ["Sketchfab_model", "Sketchfab_model.002"]) {
    const sketchfab = source.getObjectByName(sketchfabName);
    if (sketchfab) {
      sketchfab.visible = false;
    }
  }

  const elevatedFloor = source.getObjectByName("Lobby_Elevated_Floor");
  if (elevatedFloor) {
    staticColliders.add(cloneColliderSubtree(elevatedFloor));
  }

  const wallsMesh = source.getObjectByName("Lobby_Floor_Walls");
  if (wallsMesh) {
    staticColliders.add(cloneColliderSubtree(wallsMesh));
  }

  // Reception desk — trimesh only so the circular loop stays walkable inside.
  const deskRoots: Object3D[] = [];
  const namedDesk = source.getObjectByName("Reception_Desk_Lobby");
  if (namedDesk) {
    deskRoots.push(namedDesk);
  } else {
    source.traverse((object) => {
      if (/^Reception_Desk/i.test(object.name) && !deskRoots.includes(object)) {
        deskRoots.push(object);
      }
    });
  }

  let receptionDeskInteractPoint: Vector3 | null = null;
  for (const root of deskRoots) {
    root.updateWorldMatrix(true, true);
    staticColliders.add(cloneColliderSubtree(root));

    if (!receptionDeskInteractPoint) {
      const deskBounds = new Box3().setFromObject(root);
      if (!deskBounds.isEmpty()) {
        const center = deskBounds.getCenter(new Vector3());
        // Midpoint between the near-rim inset (0.95) and the deeper 28% mark.
        const deskDepth = deskBounds.max.z - deskBounds.min.z;
        receptionDeskInteractPoint = new Vector3(
          center.x,
          deskBounds.max.y + 0.25,
          deskBounds.min.z + (0.95 + deskDepth * 0.28) * 0.5,
        );
      }
    }
  }

  source.traverse((object) => {
    if (
      object.name.includes("Column") ||
      object.name.startsWith("Cylinder")
    ) {
      staticColliders.add(cloneColliderSubtree(object));
    }
  });

  source.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) {
      return;
    }
    if (
      mesh.name === "Vert" ||
      mesh.name.startsWith("Vert") ||
      /baseboard|trim|plinth/i.test(mesh.name)
    ) {
      staticColliders.add(cloneColliderSubtree(mesh));
    }
  });

  const lecternRoot =
    source.getObjectByName("Sketchfab_model.001") ??
    source.getObjectByName("lectern_HP");
  const lecternColliders = new Group();
  lecternColliders.name = "LecternColliders";
  const lecternBoxes: CuboidBox[] = [];
  let lecternInteractPoint: Vector3 | null = null;

  if (lecternRoot) {
    lecternRoot.updateWorldMatrix(true, true);
    lecternRoot.traverse((object) => {
      const mesh = object as Mesh;
      if (mesh.isMesh) {
        lecternColliders.add(bakeMeshWorldGeometry(mesh));
      }
    });

    const box = boxFromObject(lecternRoot, 0.45);
    const lecternBounds = new Box3().setFromObject(lecternRoot);
    if (box && !lecternBounds.isEmpty()) {
      const center = lecternBounds.getCenter(new Vector3());

      // Full solid cuboid from the lectern AABB — short boxes let the player clip through.
      lecternBoxes.push({
        args: [
          Math.max(box.args[0] * 0.7, 0.4),
          Math.max(box.args[1], 0.75),
          Math.max(box.args[2] * 0.7, 0.4),
        ],
        position: [box.position[0], box.position[1], box.position[2]],
      });

      // Just above the lectern reading surface.
      lecternInteractPoint = new Vector3(
        center.x,
        lecternBounds.max.y + 0.25,
        center.z,
      );
    }
  }

  if (lecternBoxes.length === 0 && lecternColliders.children.length === 0) {
    lecternBoxes.push({
      args: [0.45, 0.75, 0.45],
      position: [0, 0.75, -12.5],
    });
    lecternInteractPoint = new Vector3(0, 1.75, -12.5);
  }

  const floorMesh = source.getObjectByName("Lobby_Floor_Walls");
  const floorBounds = floorMesh
    ? new Box3().setFromObject(floorMesh)
    : new Box3().setFromObject(source);

  const baseboardBoxes = buildPerimeterBaseboardBoxes(floorBounds);

  const prepared: PreparedRoom = {
    revision: ROOM_PREPARE_REVISION,
    room: source,
    staticColliders,
    floorBounds,
    baseboardBoxes,
    lecternBoxes,
    lecternColliders,
    lecternInteractPoint,
    receptionDeskInteractPoint,
  };
  preparedRooms.set(source, prepared);
  return prepared;
}

function LobbyRoom() {
  const gltf = useLobbyGLTF(LOBBY_GLB);
  const scene = gltf.scene;
  const setSpawnPoint = useGameStore((state) => state.setSpawnPoint);
  const setFloorSurfaceY = useGameStore((state) => state.setFloorSurfaceY);
  const setLecternInteractPoint = useGameStore(
    (state) => state.setLecternInteractPoint,
  );
  const setReceptionDeskInteractPoint = useGameStore(
    (state) => state.setReceptionDeskInteractPoint,
  );

  useEffect(() => {
    void useLobbyLoadStore.getState().finish();
  }, [gltf]);

  const layout = useMemo(() => {
    const prepared = prepareRoomContent(scene);
    const { floorBounds } = prepared;
    const center = floorBounds.getCenter(new Vector3());
    const floorSize = floorBounds.getSize(new Vector3());

    // Room is correctly oriented — floor is the bottom of the floor/walls mesh.
    const floorSurfaceY = floorBounds.min.y;

    // Elevated floor / stairs sit toward +Z; spawn near the opposite (-Z) wall
    // facing them. Default camera looks down -Z, so yaw = π faces +Z.
    const spawnInset = 2.5;
    const spawnPoint = new Vector3(
      center.x,
      // Clearance must exceed the character controller contact offset
      // so the capsule doesn't start the first step in penetration.
      floorSurfaceY + CAPSULE_BOTTOM_OFFSET + 0.1,
      floorBounds.min.z + spawnInset,
    );
    const spawnYaw = Math.PI;

    return {
      room: prepared.room,
      staticColliders: prepared.staticColliders,
      baseboardBoxes: prepared.baseboardBoxes,
      lecternBoxes: prepared.lecternBoxes,
      lecternColliders: prepared.lecternColliders,
      lecternInteractPoint: prepared.lecternInteractPoint,
      receptionDeskInteractPoint: prepared.receptionDeskInteractPoint,
      center,
      floorSize,
      floorSurfaceY,
      spawnPoint,
      spawnYaw,
    };
  }, [scene]);

  useEffect(() => {
    setFloorSurfaceY(layout.floorSurfaceY);
    setSpawnPoint(layout.spawnPoint, layout.spawnYaw);
    setLecternInteractPoint(layout.lecternInteractPoint);
    setReceptionDeskInteractPoint(layout.receptionDeskInteractPoint);
  }, [
    layout.floorSurfaceY,
    layout.spawnPoint,
    layout.spawnYaw,
    layout.lecternInteractPoint,
    layout.receptionDeskInteractPoint,
    setFloorSurfaceY,
    setSpawnPoint,
    setLecternInteractPoint,
    setReceptionDeskInteractPoint,
  ]);

  return (
    <>
      <primitive object={layout.room} />
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider
          args={[
            Math.max(layout.floorSize.x * 0.5, 5),
            0.15,
            Math.max(layout.floorSize.z * 0.5, 5),
          ]}
          position={[
            layout.center.x,
            layout.floorSurfaceY - 0.15,
            layout.center.z,
          ]}
        />
        {layout.baseboardBoxes.map((box, index) => (
          <CuboidCollider
            key={`baseboard-${index}`}
            args={box.args}
            position={box.position}
          />
        ))}
      </RigidBody>
      {/* Lectern: dedicated body with padded cuboid + world-baked hull/trimesh. */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        {layout.lecternBoxes.map((box, index) => (
          <CuboidCollider
            key={`lectern-box-${index}`}
            args={box.args}
            position={box.position}
          />
        ))}
      </RigidBody>
      {layout.lecternColliders.children.length > 0 ? (
        <RigidBody
          type="fixed"
          colliders="trimesh"
          friction={1}
          includeInvisible
        >
          <primitive object={layout.lecternColliders} />
        </RigidBody>
      ) : null}
      {/* includeInvisible is required: the collider clones' meshes are
          visible=false, and rapier skips invisible meshes by default. */}
      <RigidBody
        type="fixed"
        colliders="trimesh"
        friction={1}
        includeInvisible
      >
        <primitive object={layout.staticColliders} />
      </RigidBody>
      <Environment preset="apartment" />
    </>
  );
}

function Player() {
  const spawnPoint = useGameStore((state) => state.spawnPoint);
  const spawnYaw = useGameStore((state) => state.spawnYaw);
  const moveSpeedMode = useGameStore((state) => state.moveSpeedMode);
  const adjustMoveSpeed = useGameStore((state) => state.adjustMoveSpeed);
  const bodyRef = useRef<RapierRigidBody>(null);
  const characterControllerRef = useRef<KinematicCharacterController | null>(null);
  const keys = useKeyboard();
  const { camera } = useThree();
  const { world } = useRapier();
  const hasSpawned = useRef(false);
  const pitch = useRef(0);
  const yaw = useRef(0);
  const moveDirection = useRef(new Vector3());
  /** Vertical velocity in m/s (not displacement). */
  const vy = useRef(0);
  const isGrounded = useRef(false);
  const jumpQueued = useRef(false);
  const coyoteTimeLeft = useRef(0);
  const jumpBufferLeft = useRef(0);
  const moveSpeedModeRef = useRef(moveSpeedMode);
  moveSpeedModeRef.current = moveSpeedMode;

  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const up = useMemo(() => new Vector3(0, 1, 0), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }
      if (event.code === "KeyC") {
        adjustMoveSpeed("slower");
      } else if (event.code === "KeyV") {
        adjustMoveSpeed("faster");
      } else if (event.code === "Space") {
        event.preventDefault();
        jumpQueued.current = true;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [adjustMoveSpeed]);

  useEffect(() => {
    const controller = world.createCharacterController(CHARACTER_OFFSET);
    controller.setSlideEnabled(true);
    controller.enableSnapToGround(SNAP_TO_GROUND);
    controller.enableAutostep(AUTO_STEP_MAX_HEIGHT, AUTO_STEP_MIN_WIDTH, true);
    controller.setMaxSlopeClimbAngle((MAX_SLOPE_CLIMB_DEG * Math.PI) / 180);
    controller.setMinSlopeSlideAngle((50 * Math.PI) / 180);
    characterControllerRef.current = controller;

    return () => {
      world.removeCharacterController(controller);
      characterControllerRef.current = null;
    };
  }, [world]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== document.querySelector("canvas")) {
        return;
      }

      yaw.current -= event.movementX * LOOK_SENSITIVITY;
      pitch.current -= event.movementY * LOOK_SENSITIVITY;
      pitch.current = Math.max(
        -Math.PI / 2 + 0.01,
        Math.min(Math.PI / 2 - 0.01, pitch.current),
      );
    };

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    body.setTranslation(
      { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z },
      true,
    );
    yaw.current = spawnYaw;
    pitch.current = 0;
    vy.current = 0;
    isGrounded.current = false;
    jumpQueued.current = false;
    coyoteTimeLeft.current = 0;
    jumpBufferLeft.current = 0;
    hasSpawned.current = true;
  }, [spawnPoint, spawnYaw]);

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    const controller = characterControllerRef.current;
    if (!body || !controller || !hasSpawned.current) {
      return;
    }

    const collider = body.collider(0);
    if (!collider) {
      return;
    }

    // The physics world steps at a fixed timestep (default 1/60), which is
    // NOT the render delta. Integrating with the render delta under-applies
    // gravity on high-refresh displays.
    const delta = world.timestep;

    if (isGrounded.current) {
      coyoteTimeLeft.current = COYOTE_TIME;
    } else {
      coyoteTimeLeft.current = Math.max(0, coyoteTimeLeft.current - delta);
    }

    if (jumpQueued.current) {
      jumpBufferLeft.current = JUMP_BUFFER_TIME;
      jumpQueued.current = false;
    } else {
      jumpBufferLeft.current = Math.max(0, jumpBufferLeft.current - delta);
    }

    // Stairs/autostep often flicker grounded off for a frame; coyote + buffer
    // keep Space reliable while climbing.
    const canJump = isGrounded.current || coyoteTimeLeft.current > 0;
    if (jumpBufferLeft.current > 0 && canJump && vy.current <= 0.5) {
      vy.current = JUMP_VELOCITY;
      isGrounded.current = false;
      coyoteTimeLeft.current = 0;
      jumpBufferLeft.current = 0;
      controller.disableSnapToGround();
    }

    if (isGrounded.current) {
      vy.current = 0;
      controller.enableSnapToGround(SNAP_TO_GROUND);
    } else {
      vy.current += GRAVITY * delta;
      vy.current = Math.max(vy.current, TERMINAL_VELOCITY);
      // Snap would cancel the jump impulse on the first airborne frames.
      if (vy.current > 0) {
        controller.disableSnapToGround();
      } else {
        controller.enableSnapToGround(SNAP_TO_GROUND);
      }
    }

    const move = moveDirection.current;
    const speed = MOVE_SPEED_BY_MODE[moveSpeedModeRef.current];
    const desiredTranslation = {
      x: move.x * speed * delta,
      y: vy.current * delta,
      z: move.z * speed * delta,
    };

    controller.computeColliderMovement(collider, desiredTranslation);

    const computedStep = controller.computedMovement();
    const position = body.translation();

    body.setNextKinematicTranslation({
      x: position.x + computedStep.x,
      y: position.y + computedStep.y,
      z: position.z + computedStep.z,
    });

    isGrounded.current = controller.computedGrounded();
    if (isGrounded.current && vy.current <= 0) {
      vy.current = 0;
    }
  });

  useFrame(() => {
    const body = bodyRef.current;
    if (!body || !hasSpawned.current) {
      return;
    }

    const translation = body.translation();
    const feetY = translation.y - CAPSULE_BOTTOM_OFFSET;

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;
    camera.position.set(
      translation.x,
      feetY + STANDING_EYE_HEIGHT,
      translation.z,
    );

    direction.set(0, 0, 0);

    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() > 0.001) {
      forward.normalize();
      right.crossVectors(forward, up).normalize();
    } else {
      forward.set(0, 0, -1);
      right.set(1, 0, 0);
    }

    if (keys.current.forward) {
      direction.add(forward);
    }
    if (keys.current.back) {
      direction.sub(forward);
    }
    if (keys.current.left) {
      direction.sub(right);
    }
    if (keys.current.right) {
      direction.add(right);
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();
      moveDirection.current.copy(direction);
    } else {
      moveDirection.current.set(0, 0, 0);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      position={[spawnPoint.x, spawnPoint.y, spawnPoint.z]}
      lockRotations
      colliders={false}
    >
      <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} />
    </RigidBody>
  );
}

function LobbyLoadingOverlay() {
  const isLoading = useLobbyLoadStore((state) => state.isLoading);
  const progress = useLobbyLoadStore((state) => state.progress);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="min-w-[11rem] whitespace-nowrap rounded border border-white/35 bg-black/70 px-4 py-2 text-center text-sm text-white/90">
        Loading lobby… {Math.round(progress)}%
      </div>
    </div>
  );
}

function formatLobbyLoadError(error: Error) {
  const message = error.message || String(error);
  // Git LFS pointer files start with "version https://git-lfs..." — loaders
  // then fail while trying to parse that text as glTF JSON.
  if (/version ht|git-lfs|not valid JSON/i.test(message)) {
    return (
      "This looks like a Git LFS pointer instead of the real GLB. " +
      "Run `git lfs pull` in the repo, then hard-refresh the page (Ctrl+Shift+R)."
    );
  }
  return message;
}

class SceneErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    useLobbyLoadStore.getState().cancel();
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Html center>
          <div className="max-w-md rounded border border-red-400/40 bg-black/85 px-4 py-3 text-center text-white">
            <p className="font-semibold">Lobby failed to load</p>
            <p className="mt-2 text-sm text-white/70">
              {formatLobbyLoadError(this.state.error)}
            </p>
          </div>
        </Html>
      );
    }
    return this.props.children;
  }
}

function LecternWorldPrompt() {
  const lecternInteractPoint = useGameStore((state) => state.lecternInteractPoint);
  return (
    <WorldInteractPrompt
      prompt={LECTERN_INTERACT_PROMPT}
      position={lecternInteractPoint}
    />
  );
}

function ReceptionDeskWorldPrompt() {
  const receptionDeskInteractPoint = useGameStore(
    (state) => state.receptionDeskInteractPoint,
  );
  return (
    <WorldInteractPrompt
      prompt={RECEPTION_DESK_INTERACT_PROMPT}
      position={receptionDeskInteractPoint}
    />
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={CAMERA_FOV} near={0.1} far={1000} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <LobbyRoom />
        </Suspense>
      </SceneErrorBoundary>
      <LecternWorldPrompt />
      <ReceptionDeskWorldPrompt />
      <Player />
    </>
  );
}

function Crosshair() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-3 w-3">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/90" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/90" />
      </div>
    </div>
  );
}

type MovementPressed = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
};

function useMovementPressed() {
  const [pressed, setPressed] = useState<MovementPressed>({
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
  });

  useEffect(() => {
    const apply = (code: string, value: boolean) => {
      setPressed((prev) => {
        switch (code) {
          case "KeyW":
          case "ArrowUp":
            return prev.forward === value ? prev : { ...prev, forward: value };
          case "KeyS":
          case "ArrowDown":
            return prev.back === value ? prev : { ...prev, back: value };
          case "KeyA":
          case "ArrowLeft":
            return prev.left === value ? prev : { ...prev, left: value };
          case "KeyD":
          case "ArrowRight":
            return prev.right === value ? prev : { ...prev, right: value };
          case "Space":
            return prev.jump === value ? prev : { ...prev, jump: value };
          default:
            return prev;
        }
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
      }
      apply(event.code, true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      apply(event.code, false);
    };

    const clearAll = () => {
      setPressed({
        forward: false,
        back: false,
        left: false,
        right: false,
        jump: false,
      });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearAll);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearAll);
    };
  }, []);

  return pressed;
}

function KeyCap({
  label,
  active,
  className = "",
}: {
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex h-9 items-center justify-center rounded border text-base font-medium transition-colors duration-75 ${
        active
          ? "border-white/20 bg-black/70 text-white/50"
          : "border-white/35 bg-black/30 text-white/80"
      } ${className}`}
    >
      {label}
    </div>
  );
}

const SPEED_LABELS: Record<MoveSpeedMode, string> = {
  slow: "SLOW",
  medium: "WALK",
  fast: "FAST",
};

const SPEED_DISPLAY_ORDER: MoveSpeedMode[] = ["fast", "medium", "slow"];

function SpeedIndicator() {
  const mode = useGameStore((state) => state.moveSpeedMode);

  return (
    <div className="flex h-[4.75rem] flex-col justify-between rounded border border-white/35 bg-black/30 px-2.5 py-1.5">
      <div className="flex flex-col gap-0.5">
        {SPEED_DISPLAY_ORDER.map((tier) => {
          const active = tier === mode;
          return (
            <div
              key={tier}
              className={`text-[10px] font-semibold tracking-wide transition-colors duration-75 ${
                active ? "text-white" : "text-white/35"
              }`}
            >
              {SPEED_LABELS[tier]}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-[9px] tracking-wider text-white/45">
        <span>
          C <span aria-hidden="true">↓</span>
        </span>
        <span>·</span>
        <span>
          V <span aria-hidden="true">↑</span>
        </span>
      </div>
    </div>
  );
}

function MovementKeys() {
  const pressed = useMovementPressed();

  return (
    <div className="absolute bottom-6 left-6 flex items-end gap-3 select-none">
      <div className="flex flex-col gap-1">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: "repeat(3, 2.25rem)",
            gridTemplateRows: "repeat(2, 2.25rem)",
            gridTemplateAreas: `
              ".    up   ."
              "left down right"
            `,
          }}
        >
          <div style={{ gridArea: "up" }}>
            <KeyCap label="↑" active={pressed.forward} className="w-9" />
          </div>
          <div style={{ gridArea: "left" }}>
            <KeyCap label="←" active={pressed.left} className="w-9" />
          </div>
          <div style={{ gridArea: "down" }}>
            <KeyCap label="↓" active={pressed.back} className="w-9" />
          </div>
          <div style={{ gridArea: "right" }}>
            <KeyCap label="→" active={pressed.right} className="w-9" />
          </div>
        </div>
        <KeyCap
          label="SPACE"
          active={pressed.jump}
          className="w-full text-xs tracking-wider"
        />
      </div>
      <SpeedIndicator />
    </div>
  );
}

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Canvas
        style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
        gl={{ antialias: true }}
        onPointerDown={(event) => {
          const canvas = event.target as HTMLElement;
          if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
          }
        }}
      >
        <Physics gravity={[0, -9.81, 0]}>
          <Scene />
        </Physics>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-10 [&_*]:pointer-events-none">
        <Crosshair />
        <MovementKeys />
      </div>
      <LobbyLoadingOverlay />
      <LecternPopup />
      <ReceptionDeskPopup />
    </div>
  );
}
