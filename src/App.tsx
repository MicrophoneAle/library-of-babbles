import { Environment, PerspectiveCamera, useGLTF } from "@react-three/drei";
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
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { KinematicCharacterController } from "@dimforge/rapier3d-compat";
import { Box3, Group, Object3D, Quaternion, Vector3 } from "three";

import { useGameStore } from "./store/gameStore";

useGLTF.preload("/assets/lobby/room_lobby.glb");

const MOVE_SPEED = 3.5;
const GRAVITY = -39.24; // ~4× Earth — snappy falls, less float off ledges/stairs
const TERMINAL_VELOCITY = -28;
const SNAP_TO_GROUND = 0.25;
// Tuned for one tall stair riser — high enough to clear steps, low enough to
// avoid leaping several at once and jamming.
const AUTO_STEP_MAX_HEIGHT = 1.0;
const AUTO_STEP_MIN_WIDTH = 0.08;
const CHARACTER_OFFSET = 0.04;
const MAX_SLOPE_CLIMB_DEG = 60;
const STANDING_EYE_HEIGHT = 1.6;
// Total capsule height = 2 * (half height + radius) = 1.4 m, 0.4 m wide.
const CAPSULE_HALF_HEIGHT = 0.5;
const CAPSULE_RADIUS = 0.2;
const CAPSULE_BOTTOM_OFFSET = CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS;
const LOOK_SENSITIVITY = 0.002;

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
  let stairs: Object3D | null = null;

  root.traverse((object) => {
    if (
      object.name === "Lobby_Stairs001" ||
      object.name === "Lobby_Stairs.001" ||
      object.name === "Lobby_Stairs"
    ) {
      if (!stairs || (object as Object3D & { isMesh?: boolean }).isMesh) {
        stairs = object;
      }
    }
  });

  return stairs;
}

function makeInvisibleColliderClone(source: Object3D) {
  const clone = source.clone(true);
  clone.traverse((child) => {
    if ((child as Object3D & { isMesh?: boolean }).isMesh) {
      child.visible = false;
    }
  });
  return clone;
}

function prepareRoomContent(source: Object3D) {
  const room = source.clone(true);
  room.updateMatrixWorld(true);

  // Invisible mesh clones for trimesh colliders (stairs + elevated floor).
  const staticColliders = new Group();

  const sketchfab = room.getObjectByName("Sketchfab_model");
  const stairsSource = sketchfab ? findStairsNode(sketchfab) : findStairsNode(room);

  if (stairsSource) {
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    stairsSource.matrixWorld.decompose(position, quaternion, scale);

    const stairs = stairsSource.clone(true);
    stairs.position.copy(position);
    stairs.quaternion.copy(quaternion);
    stairs.scale.copy(scale);
    stairs.updateMatrixWorld(true);
    room.add(stairs);
    staticColliders.add(makeInvisibleColliderClone(stairs));
  }

  const elevatedFloor = room.getObjectByName("Lobby_Elevated_Floor");
  if (elevatedFloor) {
    staticColliders.add(makeInvisibleColliderClone(elevatedFloor));
  }

  sketchfab?.parent?.remove(sketchfab);

  room.updateMatrixWorld(true);

  const floorMesh = room.getObjectByName("Lobby_Floor_Walls");
  const floorBounds = floorMesh
    ? new Box3().setFromObject(floorMesh)
    : new Box3().setFromObject(room);

  return {
    room,
    staticColliders,
    floorBounds,
  };
}

function LobbyRoom() {
  const { scene } = useGLTF("/assets/lobby/room_lobby.glb");
  const setSpawnPoint = useGameStore((state) => state.setSpawnPoint);
  const setFloorSurfaceY = useGameStore((state) => state.setFloorSurfaceY);

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
  }, [layout.floorSurfaceY, layout.spawnPoint, layout.spawnYaw, setFloorSurfaceY, setSpawnPoint]);

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
      </RigidBody>
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
    </>
  );
}

function Player() {
  const spawnPoint = useGameStore((state) => state.spawnPoint);
  const spawnYaw = useGameStore((state) => state.spawnYaw);
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

  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const up = useMemo(() => new Vector3(0, 1, 0), []);

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
      vy.current = 0;
    } else {
      vy.current += GRAVITY * delta;
      vy.current = Math.max(vy.current, TERMINAL_VELOCITY);
    }

    const move = moveDirection.current;
    const desiredTranslation = {
      x: move.x * MOVE_SPEED * delta,
      y: vy.current * delta,
      z: move.z * MOVE_SPEED * delta,
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
    if (isGrounded.current) {
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

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={75} near={0.1} far={1000} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Environment preset="apartment" />
      <Suspense fallback={null}>
        <LobbyRoom />
      </Suspense>
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
};

function useMovementPressed() {
  const [pressed, setPressed] = useState<MovementPressed>({
    forward: false,
    back: false,
    left: false,
    right: false,
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
          default:
            return prev;
        }
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
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
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded border text-base font-medium transition-colors duration-75 ${
        active
          ? "border-white/20 bg-black/70 text-white/50"
          : "border-white/35 bg-black/30 text-white/80"
      }`}
    >
      {label}
    </div>
  );
}

function MovementKeys() {
  const pressed = useMovementPressed();

  return (
    <div className="absolute bottom-6 left-6 select-none">
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
          <KeyCap label="↑" active={pressed.forward} />
        </div>
        <div style={{ gridArea: "left" }}>
          <KeyCap label="←" active={pressed.left} />
        </div>
        <div style={{ gridArea: "down" }}>
          <KeyCap label="↓" active={pressed.back} />
        </div>
        <div style={{ gridArea: "right" }}>
          <KeyCap label="→" active={pressed.right} />
        </div>
      </div>
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
    </div>
  );
}
