import { Environment, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  CuboidCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Box3, Object3D, Quaternion, Vector3 } from "three";

import { useGameStore } from "./store/gameStore";

useGLTF.preload("/room_lobby.glb");

const MOVE_SPEED = 5;
const STANDING_EYE_HEIGHT = 1.6;
const CAPSULE_HALF_HEIGHT = 0.4;
const CAPSULE_RADIUS = 0.3;
const CAPSULE_BOTTOM_OFFSET = CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS;
const LOOK_SENSITIVITY = 0.002;
const GROUND_SNAP_DISTANCE = 0.35;

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

  const stairsSource = findStairsNode(room);
  let extractedStairs: Object3D | null = null;

  if (stairsSource) {
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    stairsSource.matrixWorld.decompose(position, quaternion, scale);

    extractedStairs = stairsSource.clone(true);
    extractedStairs.position.copy(position);
    extractedStairs.quaternion.copy(quaternion);
    extractedStairs.scale.copy(scale);
    extractedStairs.updateMatrixWorld(true);
  }

  const sketchfab = room.getObjectByName("Sketchfab_model");
  sketchfab?.parent?.remove(sketchfab);

  if (extractedStairs) {
    room.add(extractedStairs);
  }

  const bounds = new Box3().setFromObject(room);

  return {
    room,
    stairsCollider: extractedStairs ? extractedStairs.clone(true) : null,
    bounds,
  };
}

function LobbyRoom() {
  const { scene } = useGLTF("/room_lobby.glb");
  const setSpawnPoint = useGameStore((state) => state.setSpawnPoint);

  const layout = useMemo(() => {
    const prepared = prepareRoomContent(scene);
    const center = prepared.bounds.getCenter(new Vector3());
    const floorSize = prepared.bounds.getSize(new Vector3());

    prepared.room.position.sub(center);

    const walkableY = 2 * center.y - prepared.bounds.min.y;
    const spawnPoint = new Vector3(
      center.x,
      walkableY - CAPSULE_BOTTOM_OFFSET - 0.1,
      center.z,
    );

    return {
      room: prepared.room,
      stairsCollider: prepared.stairsCollider,
      center,
      floorSize,
      localFloorY: prepared.bounds.min.y,
      spawnPoint,
    };
  }, [scene]);

  useEffect(() => {
    setSpawnPoint(layout.spawnPoint);
  }, [layout.spawnPoint, setSpawnPoint]);

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
  const bodyRef = useRef<RapierRigidBody>(null);
  const keys = useKeyboard();
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const hasSpawned = useRef(false);
  const pitch = useRef(0);
  const yaw = useRef(0);

  const forward = useMemo(() => new Vector3(), []);
  const right = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const up = useMemo(() => new Vector3(0, 1, 0), []);

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
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.wakeUp();
    hasSpawned.current = true;
  }, [spawnPoint]);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body || !hasSpawned.current) {
      return;
    }

    const translation = body.translation();
    const velocity = body.linvel();

    const rayOrigin = {
      x: translation.x,
      y: translation.y + CAPSULE_HALF_HEIGHT,
      z: translation.z,
    };
    const ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(
      ray,
      GROUND_SNAP_DISTANCE + CAPSULE_BOTTOM_OFFSET,
      true,
      undefined,
      undefined,
      undefined,
      body,
    );

    let nextY = translation.y;
    let nextVy = velocity.y;

    if (hit) {
      const groundY = rayOrigin.y - hit.timeOfImpact;
      const targetY = groundY + CAPSULE_BOTTOM_OFFSET;
      nextY = targetY;
      nextVy = 0;

      if (Math.abs(translation.y - targetY) > 0.001) {
        body.setTranslation(
          { x: translation.x, y: targetY, z: translation.z },
          true,
        );
      }
    }

    const feetY = nextY - CAPSULE_BOTTOM_OFFSET;

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
      body.setLinvel(
        {
          x: direction.x * MOVE_SPEED,
          y: nextVy,
          z: direction.z * MOVE_SPEED,
        },
        true,
      );
      body.wakeUp();
    } else {
      body.setLinvel(
        {
          x: velocity.x * 0.75,
          y: nextVy,
          z: velocity.z * 0.75,
        },
        true,
      );
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[spawnPoint.x, spawnPoint.y, spawnPoint.z]}
      lockRotations
      colliders={false}
      canSleep={false}
      friction={1}
      linearDamping={0.5}
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
