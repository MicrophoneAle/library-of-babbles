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
import { Box3, Object3D, Quaternion, Vector3 } from "three";

import { useGameStore } from "./store/gameStore";

useGLTF.preload("/assets/lobby/room_lobby.glb");

const MOVE_SPEED = 5;
const GRAVITY = -29.4;
const TERMINAL_VELOCITY = -55;
const GROUND_STICK = -0.1;
const GROUND_TOLERANCE = 0.25;
const STANDING_EYE_HEIGHT = 1.6;
const CAPSULE_HALF_HEIGHT = 0.4;
const CAPSULE_RADIUS = 0.3;
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

function prepareRoomContent(source: Object3D) {
  const room = source.clone(true);
  room.updateMatrixWorld(true);

  const sketchfab = room.getObjectByName("Sketchfab_model");
  const stairsSource = sketchfab ? findStairsNode(sketchfab) : findStairsNode(room);
  let stairsCollider: Object3D | null = null;

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

    stairsCollider = stairs.clone(true);
    stairsCollider.traverse((child) => {
      if ((child as Object3D & { isMesh?: boolean }).isMesh) {
        child.visible = false;
      }
    });
  }

  sketchfab?.parent?.remove(sketchfab);

  const bounds = new Box3().setFromObject(room);

  return {
    room,
    stairsCollider,
    bounds,
  };
}

function LobbyRoom() {
  const { scene } = useGLTF("/assets/lobby/room_lobby.glb");
  const setSpawnPoint = useGameStore((state) => state.setSpawnPoint);
  const setFloorSurfaceY = useGameStore((state) => state.setFloorSurfaceY);

  const layout = useMemo(() => {
    const prepared = prepareRoomContent(scene);
    const center = prepared.bounds.getCenter(new Vector3());
    const floorSize = prepared.bounds.getSize(new Vector3());

    prepared.room.position.sub(center);

    const floorSurfaceY = 2 * center.y - prepared.bounds.min.y;
    const spawnPoint = new Vector3(
      center.x,
      floorSurfaceY + CAPSULE_BOTTOM_OFFSET + 0.05,
      center.z,
    );

    return {
      room: prepared.room,
      stairsCollider: prepared.stairsCollider,
      center,
      floorSize,
      localFloorY: prepared.bounds.min.y,
      floorSurfaceY,
      spawnPoint,
    };
  }, [scene]);

  useEffect(() => {
    setFloorSurfaceY(layout.floorSurfaceY);
    setSpawnPoint(layout.spawnPoint);
  }, [layout.floorSurfaceY, layout.spawnPoint, setFloorSurfaceY, setSpawnPoint]);

  return (
    <group position={layout.center} rotation={[Math.PI, 0, 0]}>
      <group position={[-layout.center.x, -layout.center.y, -layout.center.z]}>
        <primitive object={layout.room} />
        <RigidBody type="fixed" colliders={false} friction={1}>
          <CuboidCollider
            args={[
              Math.max(layout.floorSize.x * 0.5, 5),
              0.15,
              Math.max(layout.floorSize.z * 0.5, 5),
            ]}
            position={[0, layout.localFloorY + 0.15, 0]}
          />
        </RigidBody>
        {layout.stairsCollider ? (
          <RigidBody type="fixed" colliders="trimesh" friction={1}>
            <primitive object={layout.stairsCollider} />
          </RigidBody>
        ) : null}
      </group>
    </group>
  );
}

function Player() {
  const spawnPoint = useGameStore((state) => state.spawnPoint);
  const floorSurfaceY = useGameStore((state) => state.floorSurfaceY);
  const bodyRef = useRef<RapierRigidBody>(null);
  const characterControllerRef = useRef<KinematicCharacterController | null>(null);
  const keys = useKeyboard();
  const { camera } = useThree();
  const { world } = useRapier();
  const hasSpawned = useRef(false);
  const pitch = useRef(0);
  const yaw = useRef(0);
  const deltaRef = useRef(1 / 60);
  const moveDirection = useRef(new Vector3());
  const vy = useRef(0);
  const isGrounded = useRef(true);

  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const up = useMemo(() => new Vector3(0, 1, 0), []);

  const isNearFloorSurface = (bodyY: number) => {
    if (floorSurfaceY <= 0) {
      return false;
    }

    const feetY = bodyY - CAPSULE_BOTTOM_OFFSET;
    return Math.abs(feetY - floorSurfaceY) <= GROUND_TOLERANCE;
  };

  useEffect(() => {
    const controller = world.createCharacterController(0.08);
    controller.enableSnapToGround(0.45);
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
    vy.current = 0;
    isGrounded.current = true;
    hasSpawned.current = true;
  }, [spawnPoint]);

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

    const delta = deltaRef.current;
    const position = body.translation();
    const groundedBeforeStep =
      isGrounded.current || isNearFloorSurface(position.y);

    if (groundedBeforeStep) {
      vy.current = GROUND_STICK;
    } else {
      vy.current += GRAVITY * delta;
      vy.current = Math.max(vy.current, TERMINAL_VELOCITY);
    }

    const move = moveDirection.current;
    const horizontalSpeed = MOVE_SPEED * delta;

    controller.computeColliderMovement(collider, {
      x: move.x * horizontalSpeed,
      y: vy.current * delta,
      z: move.z * horizontalSpeed,
    });

    const step = controller.computedMovement();
    const groundedAfterStep =
      controller.computedGrounded() ||
      isNearFloorSurface(position.y + step.y);

    isGrounded.current = groundedAfterStep;

    if (groundedAfterStep) {
      vy.current = GROUND_STICK;
    }

    body.setNextKinematicTranslation({
      x: position.x + step.x,
      y: position.y + step.y,
      z: position.z + step.z,
    });
  });

  useFrame((_, delta) => {
    deltaRef.current = delta;

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
