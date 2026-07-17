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
import { Suspense, useEffect, useMemo, useRef } from "react";
import type { KinematicCharacterController } from "@dimforge/rapier3d-compat";
import { Box3, Group, Object3D, Quaternion, Vector3 } from "three";

import { useGameStore } from "./store/gameStore";

useGLTF.preload("/assets/lobby/room_lobby.glb");

const MOVE_SPEED = 5;
const GRAVITY = -29.4;
const TERMINAL_VELOCITY = -55;
const SNAP_TO_GROUND = 0.2;
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
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.forward = true;
          break;
        case "KeyS":
          keys.current.back = true;
          break;
        case "KeyA":
          keys.current.left = true;
          break;
        case "KeyD":
          keys.current.right = true;
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.current.forward = false;
          break;
        case "KeyS":
          keys.current.back = false;
          break;
        case "KeyA":
          keys.current.left = false;
          break;
        case "KeyD":
          keys.current.right = false;
          break;
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

  // Group of invisible mesh clones that receive trimesh colliders.
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
      // Clearance must exceed the character controller contact offset (0.08)
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
    const controller = world.createCharacterController(0.08);
    controller.enableSnapToGround(SNAP_TO_GROUND);
    controller.enableAutostep(0.55, 0.25, true);
    controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
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
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center [&_*]:pointer-events-none">
      <div className="relative h-3 w-3">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/90" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/90" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Crosshair />
      <Canvas
        style={{ width: "100vw", height: "100vh", display: "block", cursor: "crosshair" }}
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
    </>
  );
}
